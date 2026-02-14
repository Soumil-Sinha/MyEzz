/**
 * ONDC Logistics BAP - Cryptography Module (Signing)
 * 
 * Implements ed25519 signing using tweetnacl.
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

module.exports = {
    generateKeyPair,
    createDigest,
    createSigningString,
    sign,
    createAuthorizationHeader,
};
