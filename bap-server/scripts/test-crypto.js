const cryptoLib = require('../crypto'); // Our library
const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const nodeCrypto = require('crypto');

console.log('Running Crypto Verification...');

// 1. Generate Keys (using our lib)
const senderKeys = cryptoLib.generateEncryptionKeyPair();
const receiverKeys = cryptoLib.generateEncryptionKeyPair();

console.log('Sender Pub:', senderKeys.publicKey);
console.log('Receiver Pub:', receiverKeys.publicKey);

// 2. Sender Encrypts (Simulating ONDC Registry)
const challenge = "test-challenge-string-123";

// Compute shared secret: Sender Private + Receiver Public
// We use nacl.box.before to match what we expect ONDC to roughly do (Curve25519)
const senderSecretKeyBytes = naclUtil.decodeBase64(senderKeys.privateKey);
const receiverPublicKeyBytes = naclUtil.decodeBase64(receiverKeys.publicKey);
const sharedSecretSender = nacl.box.before(receiverPublicKeyBytes, senderSecretKeyBytes);

// Encrypt with AES-256-ECB
const cipher = nodeCrypto.createCipheriv('aes-256-ecb', Buffer.from(sharedSecretSender), null);
let encrypted = cipher.update(challenge, 'utf8', 'base64');
encrypted += cipher.final('base64');
console.log('Encrypted Challenge:', encrypted);

// 3. Receiver Decrypts (Our implementation)
// Receiver decrypts: Encrypted + Sender Public + Receiver Private
const decrypted = cryptoLib.decryptChallenge(encrypted, senderKeys.publicKey, receiverKeys.privateKey);

console.log('Decrypted:', decrypted);
console.log('Match:', decrypted === challenge);

if (decrypted === challenge) {
    console.log('[SUCCESS] Crypto functions working correctly.');
} else {
    console.error('[FAILURE] Decryption failed.');
    process.exit(1);
}
