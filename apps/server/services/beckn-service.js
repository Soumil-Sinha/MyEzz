/**
 * Beckn Service - Core Beckn protocol interaction layer
 * 
 * This service handles:
 * 1. Building Beckn-compliant request payloads
 * 2. Sending requests to the gateway/mock network
 * 3. Managing the BAP's outgoing Beckn flows
 */

const axios = require('axios');
const {
    buildContext,
    generateMessageId,
    generateTransactionId,
    getTimestamp,
} = require('../../../packages/shared/helpers');
const { createAuthorizationHeader } = require('../crypto');

/**
 * Get the target gateway URL based on mode
 * @returns {string} Gateway URL
 */
function getGatewayUrl() {
    if (process.env.DEV_MODE === 'true') {
        return process.env.MOCK_SELLER_URL || 'http://localhost:4000';
    }
    return process.env.GATEWAY_URL || 'https://preprod.gateway.ondc.org';
}

/**
 * Send a Beckn protocol request
 * @param {string} action - Beckn action (search, select, init, etc.)
 * @param {object} payload - Complete Beckn payload with context and message
 * @returns {Promise<object>} Response from the recipient
 */
async function sendBecknRequest(action, payload) {
    const url = `${getGatewayUrl()}/${action}`;

    console.log(`[BECKN] Sending /${action} to ${url}`);
    console.log(`[BECKN] Transaction: ${payload.context.transaction_id}`);
    console.log(`[BECKN] Message: ${payload.context.message_id}`);

    const headers = {
        'Content-Type': 'application/json',
        Authorization: createAuthorizationHeader(payload),
    };

    try {
        const response = await axios.post(url, payload, {
            headers,
            timeout: 30000,
        });

        console.log(`[BECKN] /${action} ACK received`);
        return response.data;
    } catch (error) {
        console.error(`[BECKN] /${action} failed:`, error.message);
        throw error;
    }
}

/**
 * Build and send a /search request
 * @param {object} params - Search parameters
 * @param {object} params.pickup - Pickup location { gps, address }
 * @param {object} params.drop - Drop location { gps, address }
 * @param {string} [params.transactionId] - Transaction ID (auto-generated if not provided)
 * @returns {Promise<{ transactionId: string, messageId: string, response: object }>}
 */
async function search({ pickup, drop, transactionId }) {
    const txnId = transactionId || generateTransactionId();
    const msgId = generateMessageId();

    const context = buildContext({
        action: 'search',
        transactionId: txnId,
        messageId: msgId,
        bapId: process.env.SUBSCRIBER_ID || 'ondc-logistics-bap.example.com',
        bapUri: process.env.BAP_BASE_URL || 'http://localhost:3000',
    });

    const payload = {
        context,
        message: {
            intent: {
                category: {
                    id: 'Express Delivery',
                },
                provider: {
                    time: {
                        days: '1,2,3,4,5,6,7',
                        schedule: {
                            holidays: [],
                        },
                        range: {
                            start: '0000',
                            end: '2359',
                        },
                    },
                },
                fulfillment: {
                    type: 'Delivery',
                    start: {
                        location: {
                            gps: pickup.gps || '28.6139,77.2090',
                            address: {
                                name: pickup.address || 'Pickup Location',
                                building: pickup.building || '',
                                locality: pickup.locality || '',
                                city: pickup.city || 'New Delhi',
                                state: pickup.state || 'Delhi',
                                country: 'IND',
                                area_code: pickup.pincode || '110001',
                            },
                        },
                    },
                    end: {
                        location: {
                            gps: drop.gps || '28.5355,77.3910',
                            address: {
                                name: drop.address || 'Drop Location',
                                building: drop.building || '',
                                locality: drop.locality || '',
                                city: drop.city || 'Noida',
                                state: drop.state || 'Uttar Pradesh',
                                country: 'IND',
                                area_code: drop.pincode || '201301',
                            },
                        },
                    },
                },
                payment: {
                    type: 'POST-FULFILLMENT',
                    '@ondc/org/collection_amount': '0',
                },
                '@ondc/org/payload_details': {
                    weight: {
                        unit: 'kilogram',
                        value: 5,
                    },
                    dimensions: {
                        length: {
                            unit: 'centimeter',
                            value: 30,
                        },
                        breadth: {
                            unit: 'centimeter',
                            value: 20,
                        },
                        height: {
                            unit: 'centimeter',
                            value: 15,
                        },
                    },
                    category: 'Grocery',
                    dangerous_goods: false,
                },
            },
        },
    };

    const response = await sendBecknRequest('search', payload);

    return {
        transactionId: txnId,
        messageId: msgId,
        response,
    };
}

/**
 * Build and send a /select request
 * @param {object} params - Select parameters
 * @param {string} params.transactionId - Transaction ID from search
 * @param {string} params.providerId - Selected provider ID
 * @param {string} params.itemId - Selected item ID
 * @param {string} params.fulfillmentId - Selected fulfillment ID
 * @param {string} params.bppId - BPP ID from on_search
 * @param {string} params.bppUri - BPP URI from on_search
 * @returns {Promise<object>}
 */
async function select({ transactionId, providerId, itemId, fulfillmentId, bppId, bppUri }) {
    const msgId = generateMessageId();

    const context = buildContext({
        action: 'select',
        transactionId,
        messageId: msgId,
        bapId: process.env.SUBSCRIBER_ID || 'ondc-logistics-bap.example.com',
        bapUri: process.env.BAP_BASE_URL || 'http://localhost:3000',
        bppId,
        bppUri,
    });

    const payload = {
        context,
        message: {
            order: {
                provider: {
                    id: providerId,
                },
                items: [
                    {
                        id: itemId,
                        fulfillment_id: fulfillmentId,
                        category_id: 'Express Delivery',
                        descriptor: {
                            code: 'P2P',
                        },
                    },
                ],
                fulfillments: [
                    {
                        id: fulfillmentId,
                        type: 'Delivery',
                        start: {
                            location: {
                                gps: '28.6139,77.2090',
                                address: {
                                    name: 'Pickup Location',
                                    building: '',
                                    locality: '',
                                    city: 'New Delhi',
                                    state: 'Delhi',
                                    country: 'IND',
                                    area_code: '110001',
                                },
                            },
                        },
                        end: {
                            location: {
                                gps: '28.5355,77.3910',
                                address: {
                                    name: 'Drop Location',
                                    building: '',
                                    locality: '',
                                    city: 'Noida',
                                    state: 'Uttar Pradesh',
                                    country: 'IND',
                                    area_code: '201301',
                                },
                            },
                        },
                    },
                ],
            },
        },
    };

    const response = await sendBecknRequest('select', payload);
    return { transactionId, messageId: msgId, response };
}

/**
 * Build and send an /init request
 * @param {object} params - Init parameters
 * @param {string} params.transactionId - Transaction ID
 * @param {string} params.providerId - Provider ID
 * @param {string} params.itemId - Item ID
 * @param {string} params.fulfillmentId - Fulfillment ID
 * @param {string} params.bppId - BPP ID
 * @param {string} params.bppUri - BPP URI
 * @param {object} params.billing - Billing details
 * @returns {Promise<object>}
 */
async function init({ transactionId, providerId, itemId, fulfillmentId, bppId, bppUri, billing }) {
    const msgId = generateMessageId();

    const context = buildContext({
        action: 'init',
        transactionId,
        messageId: msgId,
        bapId: process.env.SUBSCRIBER_ID || 'ondc-logistics-bap.example.com',
        bapUri: process.env.BAP_BASE_URL || 'http://localhost:3000',
        bppId,
        bppUri,
    });

    const payload = {
        context,
        message: {
            order: {
                provider: {
                    id: providerId,
                },
                items: [
                    {
                        id: itemId,
                        fulfillment_id: fulfillmentId,
                        category_id: 'Express Delivery',
                        descriptor: {
                            code: 'P2P',
                        },
                    },
                ],
                billing: billing || {
                    name: 'ONDC Logistics User',
                    phone: '9999999999',
                    email: 'user@example.com',
                    address: {
                        name: 'Billing Address',
                        building: '123',
                        locality: 'Main Street',
                        city: 'New Delhi',
                        state: 'Delhi',
                        country: 'IND',
                        area_code: '110001',
                    },
                    tax_number: 'GSTIN1234567890',
                    created_at: getTimestamp(),
                    updated_at: getTimestamp(),
                },
                fulfillments: [
                    {
                        id: fulfillmentId,
                        type: 'Delivery',
                        start: {
                            location: {
                                gps: '28.6139,77.2090',
                                address: {
                                    name: 'Pickup Location',
                                    building: '',
                                    locality: '',
                                    city: 'New Delhi',
                                    state: 'Delhi',
                                    country: 'IND',
                                    area_code: '110001',
                                },
                            },
                            contact: {
                                phone: '9876543210',
                                email: 'sender@example.com',
                            },
                        },
                        end: {
                            location: {
                                gps: '28.5355,77.3910',
                                address: {
                                    name: 'Drop Location',
                                    building: '',
                                    locality: '',
                                    city: 'Noida',
                                    state: 'Uttar Pradesh',
                                    country: 'IND',
                                    area_code: '201301',
                                },
                            },
                            contact: {
                                phone: '9876543211',
                                email: 'receiver@example.com',
                            },
                        },
                    },
                ],
                payment: {
                    type: 'POST-FULFILLMENT',
                    collected_by: 'BAP',
                    '@ondc/org/settlement_details': [
                        {
                            settlement_counterparty: 'buyer-app',
                            settlement_type: 'neft',
                            beneficiary_name: 'ONDC Logistics BAP',
                            settlement_bank_account_no: '1234567890',
                            settlement_ifsc_code: 'SBIN0000001',
                        },
                    ],
                },
            },
        },
    };

    const response = await sendBecknRequest('init', payload);
    return { transactionId, messageId: msgId, response };
}

module.exports = {
    search,
    select,
    init,
    sendBecknRequest,
    getGatewayUrl,
};
