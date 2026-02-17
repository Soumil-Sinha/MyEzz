/**
 * Beckn Protocol Routes - Callback endpoints
 * 
 * These endpoints receive asynchronous callbacks from the ONDC network
 * (or mock network in DEV_MODE). They follow the Beckn protocol callback pattern.
 * 
 * Endpoints:
 *   POST /beckn/on_search  - Receives search results
 *   POST /beckn/on_select  - Receives select results
 *   POST /beckn/on_init    - Receives init results
 *   POST /beckn/on_status  - Receives status updates
 *   POST /beckn/on_error   - Receives error callbacks
 */

const express = require('express');
const router = express.Router();
const store = require('../store');
const { verifyAuthorizationHeader } = require('../crypto');
const { buildAckResponse, buildNackResponse, validateContext } = require('../helpers');

/**
 * Middleware: Verify Authorization header on incoming callbacks
 */
function verifyAuth(req, res, next) {
    const result = verifyAuthorizationHeader(req);

    if (!result.valid) {
        console.warn('[BECKN-CB] Authorization verification failed:', result.error);
        const context = req.body?.context || {};
        return res.json(buildNackResponse(context, '401', result.error));
    }

    next();
}

/**
 * Middleware: Validate Beckn context
 */
function validateBecknContext(req, res, next) {
    if (!req.body || !req.body.context) {
        return res.status(400).json({
            error: { type: 'PROTOCOL-ERROR', code: '400', message: 'Missing context' },
        });
    }

    const { valid, errors } = validateContext(req.body.context);
    if (!valid) {
        console.warn('[BECKN-CB] Context validation errors:', errors);
        // Log but don't reject — be lenient in dev mode
        if (process.env.DEV_MODE !== 'true') {
            return res.json(buildNackResponse(req.body.context, '400', errors.join('; ')));
        }
    }

    next();
}

/**
 * POST /beckn/on_search
 * 
 * Receives catalog/provider data from BPPs in response to /search
 */
router.post('/on_search', verifyAuth, validateBecknContext, (req, res) => {
    const { context, message } = req.body;
    const transactionId = context.transaction_id;

    console.log(`[BECKN-CB] /on_search received - txn: ${transactionId}`);
    console.log(`[BECKN-CB] BPP: ${context.bpp_id || 'unknown'}`);

    if (!transactionId) {
        return res.json(buildNackResponse(context, '400', 'Missing transaction_id'));
    }

    // Store the catalog data
    const txn = store.addCatalogData(transactionId, {
        context,
        message,
    });

    if (!txn) {
        console.warn(`[BECKN-CB] Transaction not found: ${transactionId}`);
        return res.json(buildNackResponse(context, '404', 'Transaction not found'));
    }

    const providerCount = message?.catalog?.['bpp/providers']?.length || 0;
    console.log(`[BECKN-CB] Stored ${providerCount} providers for txn: ${transactionId}`);

    res.json(buildAckResponse(context));
});

/**
 * POST /beckn/on_select
 * 
 * Receives quote/breakup from BPP after /select
 */
router.post('/on_select', verifyAuth, validateBecknContext, (req, res) => {
    const { context, message } = req.body;
    const transactionId = context.transaction_id;

    console.log(`[BECKN-CB] /on_select received - txn: ${transactionId}`);

    if (!transactionId) {
        return res.json(buildNackResponse(context, '400', 'Missing transaction_id'));
    }

    const txn = store.addSelectData(transactionId, { context, message });

    if (!txn) {
        return res.json(buildNackResponse(context, '404', 'Transaction not found'));
    }

    console.log(`[BECKN-CB] Select data stored for txn: ${transactionId}`);
    res.json(buildAckResponse(context));
});

/**
 * POST /beckn/on_init
 * 
 * Receives order initialization confirmation from BPP
 */
router.post('/on_init', verifyAuth, validateBecknContext, (req, res) => {
    const { context, message } = req.body;
    const transactionId = context.transaction_id;

    console.log(`[BECKN-CB] /on_init received - txn: ${transactionId}`);

    if (!transactionId) {
        return res.json(buildNackResponse(context, '400', 'Missing transaction_id'));
    }

    const txn = store.addInitData(transactionId, { context, message });

    if (!txn) {
        return res.json(buildNackResponse(context, '404', 'Transaction not found'));
    }

    console.log(`[BECKN-CB] Init data stored for txn: ${transactionId}`);
    res.json(buildAckResponse(context));
});

/**
 * POST /beckn/on_status
 * 
 * Receives status updates from BPP
 */
router.post('/on_status', verifyAuth, validateBecknContext, (req, res) => {
    const { context, message } = req.body;
    const transactionId = context.transaction_id;

    console.log(`[BECKN-CB] /on_status received - txn: ${transactionId}`);

    if (!transactionId) {
        return res.json(buildNackResponse(context, '400', 'Missing transaction_id'));
    }

    const txn = store.addStatusData(transactionId, { context, message });

    if (!txn) {
        return res.json(buildNackResponse(context, '404', 'Transaction not found'));
    }

    console.log(`[BECKN-CB] Status data stored for txn: ${transactionId}`);
    res.json(buildAckResponse(context));
});

/**
 * POST /beckn/on_error
 * 
 * Receives error callbacks from BPP or gateway
 */
router.post('/on_error', verifyAuth, (req, res) => {
    const { context, error } = req.body;
    const transactionId = context?.transaction_id;

    console.error(`[BECKN-CB] /on_error received - txn: ${transactionId}`);
    console.error(`[BECKN-CB] Error:`, error);

    if (transactionId) {
        store.addErrorData(transactionId, { context, error });
    }

    res.json(buildAckResponse(context || {}));
});

module.exports = router;
