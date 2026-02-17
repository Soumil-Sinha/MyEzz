/**
 * ONDC Site Verification Signer
 * 
 * Signs a unique_req_id from the ONDC registration portal
 * and outputs the HTML content for ondc-site-verification.html
 * 
 * Usage: node scripts/sign-verification.js <unique_req_id>
 * 
 * The unique_req_id is obtained from the ONDC registration portal
 * after you submit your subscriber details.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');
const fs = require('fs');
const path = require('path');

const uniqueReqId = process.argv[2];

if (!uniqueReqId) {
    console.error('Usage: node scripts/sign-verification.js <unique_req_id>');
    console.error('');
    console.error('Get the unique_req_id from the ONDC registration portal.');
    process.exit(1);
}

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
    console.error('Error: PRIVATE_KEY not found in environment variables.');
    console.error('Make sure your .env file contains PRIVATE_KEY.');
    process.exit(1);
}

// Sign the unique_req_id using ed25519
const privateKeyBytes = naclUtil.decodeBase64(privateKey);
const messageBytes = naclUtil.decodeUTF8(uniqueReqId);
const signatureBytes = nacl.sign.detached(messageBytes, privateKeyBytes);
const signedValue = naclUtil.encodeBase64(signatureBytes);

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  ONDC Site Verification Signer');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('unique_req_id:', uniqueReqId);
console.log('Signed value:', signedValue);
console.log('');

// Generate the HTML content
const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>ONDC Site Verification</title>
    <meta name="ondc-site-verification" content="${signedValue}" />
</head>
<body>
    <h1>ONDC Site Verification</h1>
    <p>This file is used for domain verification by ONDC.</p>
</body>
</html>
`;

// Write to the verification file
const filePath = path.resolve(__dirname, '../public/.well-known/ondc-site-verification.html');
fs.writeFileSync(filePath, htmlContent, 'utf8');
console.log(`Written to: ${filePath}`);
console.log('');
console.log('[SUCCESS] Site verification file updated. Deploy to Railway to apply.');
console.log('═══════════════════════════════════════════════');
console.log('');
