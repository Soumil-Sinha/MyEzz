const express = require('express');
const router = express.Router();
const store = require('../store');
const { verifyAuthorizationHeader } = require('../crypto/verify');
const { buildAckResponse, buildNackResponse, validateContext } = require('../helpers');

function verifyAuth(req, res, next) {
    const result = verifyAuthorizationHeader(req);
    if (!result.valid) {
        console.warn('[BECKN-CB] Authorization verification failed:', result.error);
        const context = req.body?.context || {};
        return res.json(buildNackResponse(context, '401', result.error));
    }
    next();
}

function validateBecknContext(req, res, next) {
    if (!req.body || !req.body.context) {
        return res.status(400).json({
            error: { type: 'PROTOCOL-ERROR', code: '400', message: 'Missing context' },
        });
    }
    const { valid, errors } = validateContext(req.body.context);
    if (!valid) {
        console.warn('[BECKN-CB] Context validation errors:', errors);
        if (process.env.DEV_MODE !== 'true') {
            return res.json(buildNackResponse(req.body.context, '400', errors.join('; ')));
        }
    }
    next();
}

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

module.exports = router;
