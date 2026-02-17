/**
 * ONDC Logistics BAP Server - Entry Point
 * 
 * This server acts as the Beckn Application Platform (BAP) participant.
 * It exposes REST endpoints for the mobile app and implements the
 * Beckn protocol flows for logistics search, select, init, etc.
 */

const path = require('path');
// Try local .env first (for Railway/standalone), then parent .env (for monorepo dev)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Client API Routes
const searchRoutes = require('./routes/search');
const selectRoutes = require('./routes/select');
const initRoutes = require('./routes/init');
const confirmRoutes = require('./routes/confirm');
const statusRoutes = require('./routes/status');
const cancelRoutes = require('./routes/cancel');

// Beckn Callback Routes
const onSearchRoutes = require('./routes/on_search');
const onSelectRoutes = require('./routes/on_select');
const onInitRoutes = require('./routes/on_init');
const onConfirmRoutes = require('./routes/on_confirm');
const onStatusRoutes = require('./routes/on_status');
const onCancelRoutes = require('./routes/on_cancel');
const store = require('./store');

const app = express();
const PORT = process.env.BAP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        mode: process.env.DEV_MODE === 'true' ? 'development' : 'production',
        domain: process.env.DOMAIN || 'ONDC:LOG10',
        version: process.env.CORE_VERSION || '1.2.0',
        uptime: process.uptime(),
    });
});

// REST API routes (for mobile app)
app.use('/api', searchRoutes);
app.use('/api', selectRoutes);
app.use('/api', initRoutes);
app.use('/api', confirmRoutes);
app.use('/api', statusRoutes);
app.use('/api', cancelRoutes);

// Serve static files (for ONDC site verification)
app.use(express.static('public'));

// ONDC Registration route — must be at root level (Registry calls {subscriber_url}/on_subscribe)
app.use(require('./routes/on_subscribe'));

// Beckn protocol callback routes (for ONDC network / mock network)
app.use('/beckn', onSearchRoutes);
app.use('/beckn', onSelectRoutes);
app.use('/beckn', onInitRoutes);
app.use('/beckn', onConfirmRoutes);
app.use('/beckn', onStatusRoutes);
app.use('/beckn', onCancelRoutes);

// Error handler
app.use((err, req, res, _next) => {
    console.error('[ERROR]', err.message);
    console.error(err.stack);
    res.status(500).json({
        error: {
            type: 'INTERNAL-ERROR',
            code: '500',
            message: err.message || 'Internal Server Error',
        },
    });
});

// Start server
app.listen(PORT, () => {
    const mode = process.env.DEV_MODE === 'true' ? 'DEV (mock network)' : 'PRODUCTION (ONDC network)';
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║     ONDC Logistics BAP Server                ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Port:     ${PORT}                              ║`);
    console.log(`║  Mode:     ${mode.padEnd(33)}║`);
    console.log(`║  Domain:   ONDC:LOG10                         ║`);
    console.log(`║  Version:  1.2.0                              ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');

    if (process.env.DEV_MODE === 'true') {
        console.log('[INFO] Running in DEV_MODE - using mock ONDC network');
        console.log(`[INFO] Mock seller URL: ${process.env.MOCK_SELLER_URL || 'http://localhost:4000'}`);
    } else {
        console.log('[INFO] Running in PRODUCTION mode - connecting to real ONDC network');
        console.log(`[INFO] Gateway URL: ${process.env.GATEWAY_URL}`);
    }
    console.log('');
});

module.exports = app;
