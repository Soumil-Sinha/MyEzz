const express = require('express');
const router = express.Router();
const store = require('../store');
const becknService = require('../services/beckn-service');

/**
 * POST /api/status
 * 
 * Mobile app requests status update for an order.
 * Server triggers Beckn /status flow.
 */
router.post('/status', async (req, res) => {
    try {
        const { transactionId, bppId, bppUri } = req.body;

        if (!transactionId) {
            return res.status(400).json({
                error: 'transactionId is required',
            });
        }

        const txn = store.getTransaction(transactionId);
        if (!txn) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        console.log(`[API] /status - Txn: ${transactionId}`);

        const result = await becknService.status({
            transactionId,
            bppId,
            bppUri,
        });

        res.json({
            success: true,
            transactionId,
            messageId: result.messageId,
            status: 'tracking',
            message: 'Status check initiated. Await on_status callback.',
        });
    } catch (error) {
        console.error('[API] Status error:', error.message);
        res.status(500).json({ error: 'Status check failed', details: error.message });
    }
});

/**
 * GET /api/transaction/:transactionId
 * 
 * Get full transaction state for debugging/status
 */
router.get('/transaction/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const txn = store.getTransaction(transactionId);

    if (!txn) {
        return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(txn);
});

module.exports = router;
