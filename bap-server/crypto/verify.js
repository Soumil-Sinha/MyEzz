/**
 * ONDC Logistics BAP - Cryptography Module (Verification)
 * 
 * Implements ed25519 verification using tweetnacl.
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const { createDigest, createSigningString } = require('./sign');

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
    verify,
    parseAuthorizationHeader,
    verifyAuthorizationHeader,
};
