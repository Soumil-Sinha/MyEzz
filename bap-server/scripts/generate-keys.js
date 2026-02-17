/**
 * Key generation script for ONDC BAP
 * Generates ed25519 key pair and outputs base64-encoded values
 * 
 * Usage: node scripts/generate-keys.js
 */

const crypto = require('../crypto');

const signingKeys = crypto.generateKeyPair();
const encryptionKeys = crypto.generateEncryptionKeyPair();

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  ONDC BAP - Key Pair Generator');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('Add these to your .env file:');
console.log('');
console.log(`# Signing Keys (Ed25519)`);
console.log(`PUBLIC_KEY=${signingKeys.publicKey}`);
console.log(`PRIVATE_KEY=${signingKeys.privateKey}`);
console.log('');
console.log(`# Encryption Keys (X25519)`);
console.log(`ENCRYPTION_PUBLIC_KEY=${encryptionKeys.publicKey}`);
console.log(`ENCRYPTION_PRIVATE_KEY=${encryptionKeys.privateKey}`);
console.log('');
console.log('═══════════════════════════════════════════════');

