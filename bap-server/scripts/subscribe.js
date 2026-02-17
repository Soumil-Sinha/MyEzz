/**
 * ONDC BAP Subscription Script
 * Usage: node scripts/subscribe.js [staging|preprod]
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const crypto = require('../crypto');

const ENV = process.argv[2] || 'staging';
const REGISTRY_URL = ENV === 'production'
    ? 'https://prod.registry.ondc.org/subscribe'
    : (ENV === 'preprod' ? 'https://preprod.registry.ondc.org/ondc/subscribe' : 'https://staging.registry.ondc.org/subscribe');

const subscriberId = process.env.SUBSCRIBER_ID;
const subscriberUrl = process.env.SUBSCRIBER_URL;
const uniqueKeyId = process.env.UNIQUE_KEY_ID;
const signingPublicKey = process.env.PUBLIC_KEY;
const encryptionPublicKey = process.env.ENCRYPTION_PUBLIC_KEY;
const privateKey = process.env.PRIVATE_KEY;

if (!subscriberId || !subscriberUrl || !signingPublicKey || !encryptionPublicKey || !privateKey) {
    console.error('Error: Missing required environment variables. Check .env');
    console.error('Required: SUBSCRIBER_ID, SUBSCRIBER_URL, PUBLIC_KEY, ENCRYPTION_PUBLIC_KEY, PRIVATE_KEY');
    process.exit(1);
}

const payload = {
    context: {
        operation: {
            ops_no: 1 // 1 = BAP, 2 = BPP
        }
    },
    message: {
        request_id: crypto.generateUUID ? crypto.generateUUID() : require('crypto').randomUUID(),
        timestamp: new Date().toISOString(),
        entity: {
            subscriber_id: subscriberId,
            country: process.env.COUNTRY || 'IND',
            city: process.env.CITY || 'std:011',
            domain: process.env.DOMAIN || 'ONDC:LOG10',
            signing_public_key: signingPublicKey,
            enc_public_key: encryptionPublicKey,
            valid_from: new Date().toISOString(),
            valid_until: new Date(Date.now() + 315360000000).toISOString(), // ~10 years
            unique_key_id: uniqueKeyId,
        },
        network_participant: [
            {
                subscriber_url: subscriberUrl,
                domain: process.env.DOMAIN || 'ONDC:LOG10',
                type: 'buyerApp',
                msn: false,
                city_code: [process.env.CITY || 'std:011']
            }
        ]
    }
};

// Sign the payload (ONDC requires signing the request_id or the full payload? 
// Actually for /subscribe it uses the Authorization header)
// BUT some registries accept signed body. The standard is Auth header.
// Let's use Auth header.

console.log(`Subscribing to ${ENV} Registry: ${REGISTRY_URL}`);
console.log('Subscriber ID:', subscriberId);
console.log('Subscriber URL:', subscriberUrl);

async function subscribe() {
    try {
        const header = crypto.createAuthorizationHeader(payload);

        const response = await axios.post(REGISTRY_URL, payload, {
            headers: {
                Authorization: header
            }
        });

        console.log('Response:', response.data);
        console.log('SUCCESS! Please check if you received a challenge on /on_subscribe');
    } catch (error) {
        console.error('Subscription failed:', error.response?.data || error.message);
    }
}

subscribe();
