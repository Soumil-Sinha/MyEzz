/**
 * Mock ONDC Network - Entry Point
 * 
 * Simulates the ONDC network by combining:
 * 1. Mock Gateway - Receives requests from BAP and forwards to mock seller
 * 2. Mock Seller (BPP) - Returns logistics quotes and processes orders
 * 
 * This allows the BAP to operate in a fully offline mode with realistic
 * Beckn protocol behavior, including asynchronous callbacks.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const express = require('express');
const morgan = require('morgan');
const { handleSearch, handleSelect, handleInit } = require('./mock-seller');
const { routeToSeller } = require('./mock-gateway');

const app = express();
const PORT = process.env.MOCK_PORT || 4000;

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'mock-ondc-network',
        components: ['gateway', 'seller-bpp'],
    });
});

/**
 * POST /search
 * Mock Gateway receives search from BAP → forwards to mock seller
 */
app.post('/search', (req, res) => {
    const { context } = req.body;
    console.log(`[MOCK-GW] /search received - txn: ${context?.transaction_id}`);

    // ACK immediately (Beckn async pattern)
    res.json({
        context: {
            ...context,
            timestamp: new Date().toISOString(),
        },
        message: {
            ack: {
                status: 'ACK',
            },
        },
    });

    // Route to mock seller asynchronously
    routeToSeller('search', req.body);
});

/**
 * POST /select
 * Mock Gateway receives select from BAP → forwards to mock seller
 */
app.post('/select', (req, res) => {
    const { context } = req.body;
    console.log(`[MOCK-GW] /select received - txn: ${context?.transaction_id}`);

    res.json({
        context: {
            ...context,
            timestamp: new Date().toISOString(),
        },
        message: {
            ack: {
                status: 'ACK',
            },
        },
    });

    routeToSeller('select', req.body);
});

/**
 * POST /init
 * Mock Gateway receives init from BAP → forwards to mock seller
 */
app.post('/init', (req, res) => {
    const { context } = req.body;
    console.log(`[MOCK-GW] /init received - txn: ${context?.transaction_id}`);

    res.json({
        context: {
            ...context,
            timestamp: new Date().toISOString(),
        },
        message: {
            ack: {
                status: 'ACK',
            },
        },
    });

    routeToSeller('init', req.body);
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║     Mock ONDC Network                        ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Port:     ${PORT}                              ║`);
    console.log('║  Gateway:  ✓ Active                           ║');
    console.log('║  Seller:   ✓ Active (4 providers)             ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log('[MOCK] Providers available:');
    console.log('  • Delhivery  – ₹62  – 45 min – Bike');
    console.log('  • Shadowfax  – ₹68  – 42 min – Bike');
    console.log('  • Porter     – ₹120 – 30 min – Van');
    console.log('  • Borzo      – ₹95  – 38 min – Auto');
    console.log('');
});

module.exports = app;
