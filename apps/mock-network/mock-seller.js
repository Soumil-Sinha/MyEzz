/**
 * Mock Seller (BPP) - Simulates ONDC logistics seller platform
 * 
 * This module generates valid Beckn on_search, on_select, and on_init
 * callbacks with realistic logistics provider data.
 * 
 * Providers:
 *   Delhivery  – ₹62  – 45 min – Bike
 *   Shadowfax  – ₹68  – 42 min – Bike
 *   Porter     – ₹120 – 30 min – Van
 *   Borzo      – ₹95  – 38 min – Auto
 */

const axios = require('axios');

const MOCK_BPP_ID = 'mock-logistics-bpp.ondc.org';
const MOCK_BPP_URI = 'http://localhost:4000';

/**
 * Build the mock logistics catalog with all 4 providers
 * @param {object} incomingContext - Context from the search request
 * @returns {object} on_search payload with catalog
 */
function buildCatalog(incomingContext) {
    const timestamp = new Date().toISOString();

    return {
        context: {
            domain: incomingContext.domain || 'ONDC:LOG10',
            country: incomingContext.country || 'IND',
            city: incomingContext.city || 'std:011',
            action: 'on_search',
            core_version: incomingContext.core_version || '1.2.0',
            bap_id: incomingContext.bap_id,
            bap_uri: incomingContext.bap_uri,
            bpp_id: MOCK_BPP_ID,
            bpp_uri: MOCK_BPP_URI,
            transaction_id: incomingContext.transaction_id,
            message_id: generateId(),
            timestamp,
            ttl: 'PT30S',
        },
        message: {
            catalog: {
                'bpp/descriptor': {
                    name: 'Mock ONDC Logistics Network',
                    short_desc: 'Aggregated logistics providers for ONDC',
                    long_desc: 'Mock BPP providing logistics quotes from multiple providers',
                    images: [
                        { url: 'https://cdn.ondc.org/mock-bpp-logo.png', size_type: 'sm' },
                    ],
                },
                'bpp/providers': [
                    {
                        id: 'delhivery-logistics',
                        descriptor: {
                            name: 'Delhivery',
                            short_desc: 'Express surface delivery',
                            long_desc: 'Pan-India express logistics with real-time tracking and last-mile delivery expertise',
                            images: [{ url: 'https://cdn.ondc.org/delhivery-logo.png', size_type: 'sm' }],
                        },
                        category_id: 'Express Delivery',
                        time: {
                            days: '1,2,3,4,5,6,7',
                            schedule: { holidays: [] },
                            range: { start: '0000', end: '2359' },
                        },
                        fulfillments: [
                            {
                                id: 'dlv-ful-1',
                                type: 'Delivery',
                                vehicle: { category: 'Bike' },
                                start: {
                                    time: {
                                        range: {
                                            start: timestamp,
                                            end: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                end: {
                                    time: {
                                        range: {
                                            start: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                                            end: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                tags: [
                                    {
                                        code: 'distance',
                                        list: [
                                            { code: 'calculation_basis', value: 'aerial' },
                                            { code: 'value', value: '8.5' },
                                            { code: 'unit', value: 'km' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        items: [
                            {
                                id: 'dlv-item-1',
                                descriptor: {
                                    name: 'Express Delivery',
                                    code: 'P2P',
                                    short_desc: 'Point to point express delivery via two-wheeler',
                                },
                                price: {
                                    currency: 'INR',
                                    value: '62.00',
                                },
                                category_id: 'Express Delivery',
                                fulfillment_id: 'dlv-ful-1',
                                time: {
                                    label: 'TAT',
                                    duration: 'PT45M',
                                    timestamp,
                                },
                                tags: [
                                    {
                                        code: 'rate_card',
                                        list: [
                                            { code: 'base_distance', value: '5' },
                                            { code: 'base_price', value: '50.00' },
                                            { code: 'per_km_charge', value: '4.00' },
                                            { code: 'distance_unit', value: 'km' },
                                        ],
                                    },
                                    {
                                        code: 'weight_slab',
                                        list: [
                                            { code: 'max_weight', value: '10' },
                                            { code: 'weight_unit', value: 'kilogram' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        locations: [
                            {
                                id: 'dlv-loc-1',
                                gps: '28.6200,77.2100',
                                address: {
                                    name: 'Delhivery Hub - Delhi',
                                    city: 'New Delhi',
                                    state: 'Delhi',
                                    country: 'IND',
                                    area_code: '110001',
                                },
                            },
                        ],
                    },
                    {
                        id: 'shadowfax-logistics',
                        descriptor: {
                            name: 'Shadowfax',
                            short_desc: 'Hyperlocal delivery network',
                            long_desc: 'On-demand hyperlocal logistics with fleet management and real-time optimization',
                            images: [{ url: 'https://cdn.ondc.org/shadowfax-logo.png', size_type: 'sm' }],
                        },
                        category_id: 'Express Delivery',
                        time: {
                            days: '1,2,3,4,5,6,7',
                            schedule: { holidays: [] },
                            range: { start: '0600', end: '2200' },
                        },
                        fulfillments: [
                            {
                                id: 'sfx-ful-1',
                                type: 'Delivery',
                                vehicle: { category: 'Bike' },
                                start: {
                                    time: {
                                        range: {
                                            start: timestamp,
                                            end: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                end: {
                                    time: {
                                        range: {
                                            start: new Date(Date.now() + 28 * 60 * 1000).toISOString(),
                                            end: new Date(Date.now() + 42 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                tags: [
                                    {
                                        code: 'distance',
                                        list: [
                                            { code: 'calculation_basis', value: 'aerial' },
                                            { code: 'value', value: '8.5' },
                                            { code: 'unit', value: 'km' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        items: [
                            {
                                id: 'sfx-item-1',
                                descriptor: {
                                    name: 'Standard Delivery',
                                    code: 'P2P',
                                    short_desc: 'Point to point delivery via two-wheeler network',
                                },
                                price: {
                                    currency: 'INR',
                                    value: '68.00',
                                },
                                category_id: 'Express Delivery',
                                fulfillment_id: 'sfx-ful-1',
                                time: {
                                    label: 'TAT',
                                    duration: 'PT42M',
                                    timestamp,
                                },
                                tags: [
                                    {
                                        code: 'rate_card',
                                        list: [
                                            { code: 'base_distance', value: '5' },
                                            { code: 'base_price', value: '55.00' },
                                            { code: 'per_km_charge', value: '4.50' },
                                            { code: 'distance_unit', value: 'km' },
                                        ],
                                    },
                                    {
                                        code: 'weight_slab',
                                        list: [
                                            { code: 'max_weight', value: '8' },
                                            { code: 'weight_unit', value: 'kilogram' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        locations: [
                            {
                                id: 'sfx-loc-1',
                                gps: '28.6350,77.2250',
                                address: {
                                    name: 'Shadowfax Hub - Delhi',
                                    city: 'New Delhi',
                                    state: 'Delhi',
                                    country: 'IND',
                                    area_code: '110002',
                                },
                            },
                        ],
                    },
                    {
                        id: 'porter-logistics',
                        descriptor: {
                            name: 'Porter',
                            short_desc: 'Intra-city tempo logistics',
                            long_desc: 'Reliable intra-city logistics with diverse fleet options for heavy or bulky items',
                            images: [{ url: 'https://cdn.ondc.org/porter-logo.png', size_type: 'sm' }],
                        },
                        category_id: 'Express Delivery',
                        time: {
                            days: '1,2,3,4,5,6,7',
                            schedule: { holidays: [] },
                            range: { start: '0500', end: '2300' },
                        },
                        fulfillments: [
                            {
                                id: 'ptr-ful-1',
                                type: 'Delivery',
                                vehicle: { category: 'Van' },
                                start: {
                                    time: {
                                        range: {
                                            start: timestamp,
                                            end: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                end: {
                                    time: {
                                        range: {
                                            start: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
                                            end: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                tags: [
                                    {
                                        code: 'distance',
                                        list: [
                                            { code: 'calculation_basis', value: 'aerial' },
                                            { code: 'value', value: '8.5' },
                                            { code: 'unit', value: 'km' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        items: [
                            {
                                id: 'ptr-item-1',
                                descriptor: {
                                    name: 'Van Delivery',
                                    code: 'P2P',
                                    short_desc: 'Point to point delivery via mini van for larger packages',
                                },
                                price: {
                                    currency: 'INR',
                                    value: '120.00',
                                },
                                category_id: 'Express Delivery',
                                fulfillment_id: 'ptr-ful-1',
                                time: {
                                    label: 'TAT',
                                    duration: 'PT30M',
                                    timestamp,
                                },
                                tags: [
                                    {
                                        code: 'rate_card',
                                        list: [
                                            { code: 'base_distance', value: '5' },
                                            { code: 'base_price', value: '90.00' },
                                            { code: 'per_km_charge', value: '10.00' },
                                            { code: 'distance_unit', value: 'km' },
                                        ],
                                    },
                                    {
                                        code: 'weight_slab',
                                        list: [
                                            { code: 'max_weight', value: '50' },
                                            { code: 'weight_unit', value: 'kilogram' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        locations: [
                            {
                                id: 'ptr-loc-1',
                                gps: '28.6100,77.2300',
                                address: {
                                    name: 'Porter Hub - Delhi',
                                    city: 'New Delhi',
                                    state: 'Delhi',
                                    country: 'IND',
                                    area_code: '110003',
                                },
                            },
                        ],
                    },
                    {
                        id: 'borzo-logistics',
                        descriptor: {
                            name: 'Borzo',
                            short_desc: 'Same day courier service',
                            long_desc: 'Same-day delivery solutions with auto-rickshaw fleet for urban logistics',
                            images: [{ url: 'https://cdn.ondc.org/borzo-logo.png', size_type: 'sm' }],
                        },
                        category_id: 'Express Delivery',
                        time: {
                            days: '1,2,3,4,5,6,7',
                            schedule: { holidays: [] },
                            range: { start: '0700', end: '2100' },
                        },
                        fulfillments: [
                            {
                                id: 'brz-ful-1',
                                type: 'Delivery',
                                vehicle: { category: 'Auto' },
                                start: {
                                    time: {
                                        range: {
                                            start: timestamp,
                                            end: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                end: {
                                    time: {
                                        range: {
                                            start: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
                                            end: new Date(Date.now() + 38 * 60 * 1000).toISOString(),
                                        },
                                    },
                                },
                                tags: [
                                    {
                                        code: 'distance',
                                        list: [
                                            { code: 'calculation_basis', value: 'aerial' },
                                            { code: 'value', value: '8.5' },
                                            { code: 'unit', value: 'km' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        items: [
                            {
                                id: 'brz-item-1',
                                descriptor: {
                                    name: 'Auto Delivery',
                                    code: 'P2P',
                                    short_desc: 'Point to point delivery via auto-rickshaw',
                                },
                                price: {
                                    currency: 'INR',
                                    value: '95.00',
                                },
                                category_id: 'Express Delivery',
                                fulfillment_id: 'brz-ful-1',
                                time: {
                                    label: 'TAT',
                                    duration: 'PT38M',
                                    timestamp,
                                },
                                tags: [
                                    {
                                        code: 'rate_card',
                                        list: [
                                            { code: 'base_distance', value: '5' },
                                            { code: 'base_price', value: '70.00' },
                                            { code: 'per_km_charge', value: '8.00' },
                                            { code: 'distance_unit', value: 'km' },
                                        ],
                                    },
                                    {
                                        code: 'weight_slab',
                                        list: [
                                            { code: 'max_weight', value: '20' },
                                            { code: 'weight_unit', value: 'kilogram' },
                                        ],
                                    },
                                ],
                            },
                        ],
                        locations: [
                            {
                                id: 'brz-loc-1',
                                gps: '28.6050,77.2150',
                                address: {
                                    name: 'Borzo Hub - Delhi',
                                    city: 'New Delhi',
                                    state: 'Delhi',
                                    country: 'IND',
                                    area_code: '110004',
                                },
                            },
                        ],
                    },
                ],
            },
        },
    };
}

/**
 * Build an on_select response with price breakup
 */
function buildSelectResponse(incomingPayload) {
    const { context, message } = incomingPayload;
    const order = message?.order || {};
    const providerId = order.provider?.id || 'delhivery-logistics';
    const items = order.items || [];
    const item = items[0] || {};

    // Find provider's base price from catalog
    const priceMap = {
        'delhivery-logistics': { base: 50, delivery: 12, total: 62 },
        'shadowfax-logistics': { base: 55, delivery: 13, total: 68 },
        'porter-logistics': { base: 90, delivery: 30, total: 120 },
        'borzo-logistics': { base: 70, delivery: 25, total: 95 },
    };

    const pricing = priceMap[providerId] || priceMap['delhivery-logistics'];

    return {
        context: {
            ...context,
            action: 'on_select',
            bpp_id: MOCK_BPP_ID,
            bpp_uri: MOCK_BPP_URI,
            message_id: generateId(),
            timestamp: new Date().toISOString(),
        },
        message: {
            order: {
                provider: {
                    id: providerId,
                },
                items: items,
                fulfillments: order.fulfillments || [],
                quote: {
                    price: {
                        currency: 'INR',
                        value: pricing.total.toFixed(2),
                    },
                    breakup: [
                        {
                            '@ondc/org/item_id': item.id || 'item-1',
                            '@ondc/org/title_type': 'delivery',
                            title: 'Delivery Charges',
                            price: {
                                currency: 'INR',
                                value: pricing.base.toFixed(2),
                            },
                        },
                        {
                            '@ondc/org/item_id': item.id || 'item-1',
                            '@ondc/org/title_type': 'tax',
                            title: 'Tax',
                            price: {
                                currency: 'INR',
                                value: pricing.delivery.toFixed(2),
                            },
                        },
                    ],
                    ttl: 'PT15M',
                },
            },
        },
    };
}

/**
 * Build an on_init response with payment details
 */
function buildInitResponse(incomingPayload) {
    const { context, message } = incomingPayload;
    const order = message?.order || {};

    return {
        context: {
            ...context,
            action: 'on_init',
            bpp_id: MOCK_BPP_ID,
            bpp_uri: MOCK_BPP_URI,
            message_id: generateId(),
            timestamp: new Date().toISOString(),
        },
        message: {
            order: {
                ...order,
                state: 'Created',
                provider: order.provider,
                items: order.items,
                billing: order.billing,
                fulfillments: order.fulfillments,
                quote: {
                    price: {
                        currency: 'INR',
                        value: '62.00',
                    },
                    breakup: [
                        {
                            '@ondc/org/item_id': order.items?.[0]?.id || 'item-1',
                            '@ondc/org/title_type': 'delivery',
                            title: 'Delivery Charges',
                            price: {
                                currency: 'INR',
                                value: '50.00',
                            },
                        },
                        {
                            '@ondc/org/item_id': order.items?.[0]?.id || 'item-1',
                            '@ondc/org/title_type': 'tax',
                            title: 'Tax',
                            price: {
                                currency: 'INR',
                                value: '12.00',
                            },
                        },
                    ],
                    ttl: 'PT15M',
                },
                payment: {
                    ...order.payment,
                    status: 'NOT-PAID',
                    type: 'POST-FULFILLMENT',
                    '@ondc/org/buyer_app_finder_fee_type': 'percent',
                    '@ondc/org/buyer_app_finder_fee_amount': '3',
                    '@ondc/org/settlement_basis': 'delivery',
                    '@ondc/org/settlement_window': 'P2D',
                },
                cancellation_terms: [
                    {
                        fulfillment_state: {
                            descriptor: {
                                code: 'Pending',
                                short_desc: 'Order is pending',
                            },
                        },
                        cancellation_fee: {
                            percentage: '0',
                            amount: {
                                currency: 'INR',
                                value: '0.00',
                            },
                        },
                    },
                    {
                        fulfillment_state: {
                            descriptor: {
                                code: 'Agent-assigned',
                                short_desc: 'Agent has been assigned',
                            },
                        },
                        cancellation_fee: {
                            percentage: '50',
                            amount: {
                                currency: 'INR',
                                value: '31.00',
                            },
                        },
                    },
                ],
                tags: [
                    {
                        code: 'bpp_terms',
                        list: [
                            { code: 'max_liability', value: '2' },
                            { code: 'max_liability_cap', value: '10000' },
                            { code: 'mandatory_arbitration', value: 'false' },
                            { code: 'court_jurisdiction', value: 'Delhi' },
                            { code: 'delay_interest', value: '1000' },
                        ],
                    },
                ],
            },
        },
    };
}

/**
 * Send callback to BAP
 */
async function sendCallback(bapUri, action, payload) {
    const url = `${bapUri}/beckn/${action}`;
    console.log(`[MOCK-SELLER] Sending /${action} callback to ${url}`);

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Signature keyId="mock-bpp|k1|ed25519",algorithm="ed25519",created="0",expires="0",headers="(created) (expires) digest",signature="mock-dev-signature"',
            },
            timeout: 10000,
        });
        console.log(`[MOCK-SELLER] /${action} callback ACK:`, response.data?.message?.ack?.status);
    } catch (error) {
        console.error(`[MOCK-SELLER] /${action} callback failed:`, error.message);
    }
}

/**
 * Handle search request - generate on_search callback
 */
function handleSearch(payload) {
    const { context } = payload;
    console.log(`[MOCK-SELLER] Processing search - txn: ${context.transaction_id}`);

    const onSearchPayload = buildCatalog(context);

    // Simulate async callback delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
        sendCallback(context.bap_uri, 'on_search', onSearchPayload);
    }, delay);
}

/**
 * Handle select request - generate on_select callback
 */
function handleSelect(payload) {
    const { context } = payload;
    console.log(`[MOCK-SELLER] Processing select - txn: ${context.transaction_id}`);

    const onSelectPayload = buildSelectResponse(payload);

    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
        sendCallback(context.bap_uri, 'on_select', onSelectPayload);
    }, delay);
}

/**
 * Handle init request - generate on_init callback
 */
function handleInit(payload) {
    const { context } = payload;
    console.log(`[MOCK-SELLER] Processing init - txn: ${context.transaction_id}`);

    const onInitPayload = buildInitResponse(payload);

    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
        sendCallback(context.bap_uri, 'on_init', onInitPayload);
    }, delay);
}

/**
 * Simple ID generator
 */
function generateId() {
    return 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
    handleSearch,
    handleSelect,
    handleInit,
    buildCatalog,
    buildSelectResponse,
    buildInitResponse,
};
