/**
 * Key generation script for ONDC BAP
 * Generates ed25519 key pair and outputs base64-encoded values
 * 
 * Usage: node scripts/generate-keys.js
 */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

const keyPair = nacl.sign.keyPair();
const publicKey = naclUtil.encodeBase64(keyPair.publicKey);
const privateKey = naclUtil.encodeBase64(keyPair.secretKey);

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  ONDC BAP - Ed25519 Key Pair Generator');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('Add these to your .env file:');
console.log('');
console.log(`PUBLIC_KEY=${publicKey}`);
console.log(`PRIVATE_KEY=${privateKey}`);
console.log('');
console.log('Public key (for ONDC registry):');
console.log(publicKey);
console.log('');
console.log('═══════════════════════════════════════════════');
