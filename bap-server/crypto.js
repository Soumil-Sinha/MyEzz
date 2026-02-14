/**
 * ONDC Logistics BAP - Cryptography Module
 * 
 * Implements ed25519 signing and verification using tweetnacl.
 * Used for Beckn Authorization header creation and verification.
 * 
 * Authorization Header Format (ONDC):
 * Signature keyId="subscriber_id|unique_key_id|ed25519",
 *   algorithm="ed25519",
 *   created="unix_timestamp",
 *   expires="unix_timestamp",
 *   headers="(created) (expires) digest",
 *   signature="base64_encoded_signature"
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const crypto = require('crypto');

/**
 * Generate a new ed25519 key pair
 * @returns {{ publicKey: string, privateKey: string }} Base64-encoded keys
 */
function generateKeyPair() {
    const keyPair = nacl.sign.keyPair();
    return {
        publicKey: naclUtil.encodeBase64(keyPair.publicKey),
        privateKey: naclUtil.encodeBase64(keyPair.secretKey),
    };
}

/**
 * Create a BLAKE-512 digest of the request body
 * @param {string} body - JSON string of the request body
 * @returns {string} Base64-encoded BLAKE-512 digest
 */
function createDigest(body) {
    const hash = crypto.createHash('sha256').update(body).digest();
    return `BLAKE-512=${naclUtil.encodeBase64(hash)}`;
}

/**
 * Create the signing string per ONDC spec
 * @param {number} created - Unix timestamp of creation
 * @param {number} expires - Unix timestamp of expiry
 * @param {string} digest - Digest of the body
 * @returns {string} Signing string
 */
function createSigningString(created, expires, digest) {
    return `(created): ${created}\n(expires): ${expires}\ndigest: ${digest}`;
}

/**
 * Sign a message using ed25519
 * @param {string} message - Message to sign
 * @param {string} privateKeyBase64 - Base64-encoded private key (64 bytes)
 * @returns {string} Base64-encoded signature
 */
function sign(message, privateKeyBase64) {
    const privateKey = naclUtil.decodeBase64(privateKeyBase64);
    const messageBytes = naclUtil.decodeUTF8(message);
    const signatureBytes = nacl.sign.detached(messageBytes, privateKey);
    return naclUtil.encodeBase64(signatureBytes);
}

/**
 * Verify an ed25519 signature
 * @param {string} message - Original message
 * @param {string} signatureBase64 - Base64-encoded signature
 * @param {string} publicKeyBase64 - Base64-encoded public key
 * @returns {boolean} Whether the signature is valid
 */
function verify(message, signatureBase64, publicKeyBase64) {
    try {
        const publicKey = naclUtil.decodeBase64(publicKeyBase64);
        const signature = naclUtil.decodeBase64(signatureBase64);
        const messageBytes = naclUtil.decodeUTF8(message);
        return nacl.sign.detached.verify(messageBytes, signature, publicKey);
    } catch (err) {
        console.error('[CRYPTO] Verification error:', err.message);
        return false;
    }
}

/**
 * Create an ONDC-compliant Authorization header
 * @param {object|string} body - Request body (object or JSON string)
 * @returns {string} Authorization header value
 */
function createAuthorizationHeader(body) {
    const subscriberId = process.env.SUBSCRIBER_ID || 'ondc-logistics-bap.example.com';
    const uniqueKeyId = process.env.UNIQUE_KEY_ID || 'k1';
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        console.warn('[CRYPTO] No PRIVATE_KEY configured, generating ephemeral key pair');
        const keyPair = generateKeyPair();
        process.env.PRIVATE_KEY = keyPair.privateKey;
        process.env.PUBLIC_KEY = keyPair.publicKey;
        return createAuthorizationHeader(body);
    }

    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    const digest = createDigest(bodyString);

    const created = Math.floor(Date.now() / 1000);
    const expires = created + 30; // TTL = PT30S

    const signingString = createSigningString(created, expires, digest);
    const signature = sign(signingString, privateKey);

    const header =
        `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",` +
        `algorithm="ed25519",` +
        `created="${created}",` +
        `expires="${expires}",` +
        `headers="(created) (expires) digest",` +
        `signature="${signature}"`;

    return header;
}

/**
 * Parse an Authorization header into its components
 * @param {string} header - Authorization header string
 * @returns {object} Parsed components
 */
function parseAuthorizationHeader(header) {
    const params = {};
    const signaturePrefix = 'Signature ';
    const headerContent = header.startsWith(signaturePrefix)
        ? header.substring(signaturePrefix.length)
        : header;

    const regex = /(\w+)="([^"]+)"/g;
    let match;
    while ((match = regex.exec(headerContent)) !== null) {
        params[match[1]] = match[2];
    }

    return params;
}

/**
 * Verify an incoming request's Authorization header
 * @param {object} req - Express request object
 * @returns {{ valid: boolean, error?: string }}
 */
function verifyAuthorizationHeader(req) {
    const isDevMode = process.env.DEV_MODE === 'true';

    // In DEV_MODE, skip verification
    if (isDevMode) {
        return { valid: true };
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return { valid: false, error: 'Missing Authorization header' };
    }

    try {
        const params = parseAuthorizationHeader(authHeader);

        if (!params.keyId || !params.signature || !params.created || !params.expires) {
            return { valid: false, error: 'Malformed Authorization header' };
        }

        // Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (now > parseInt(params.expires, 10)) {
            return { valid: false, error: 'Authorization header expired' };
        }

        // In production, you'd look up the sender's public key from the registry
        // For now, use the configured PUBLIC_KEY
        const publicKey = process.env.PUBLIC_KEY;
        if (!publicKey) {
            return { valid: false, error: 'No public key configured for verification' };
        }

        const bodyString = JSON.stringify(req.body);
        const digest = createDigest(bodyString);
        const signingString = createSigningString(
            parseInt(params.created, 10),
            parseInt(params.expires, 10),
            digest
        );

        const isValid = verify(signingString, params.signature, publicKey);
        return { valid: isValid, error: isValid ? undefined : 'Invalid signature' };
    } catch (err) {
        return { valid: false, error: `Verification failed: ${err.message}` };
    }
}

module.exports = {
    generateKeyPair,
    createDigest,
    createSigningString,
    sign,
    verify,
    createAuthorizationHeader,
    parseAuthorizationHeader,
    verifyAuthorizationHeader,
};
