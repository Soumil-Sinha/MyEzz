const express = require('express');
const router = express.Router();
const store = require('../store');
const becknService = require('../services/beckn-service');

/**
 * POST /api/cancel
 * 
 * Mobile app requests order cancellation.
 * Server triggers Beckn /cancel flow.
 */
router.post('/cancel', async (req, res) => {
    try {
        const { transactionId, cancellationReasonId, bppId, bppUri } = req.body;

        if (!transactionId || !cancellationReasonId) {
            return res.status(400).json({
                error: 'transactionId and cancellationReasonId are required',
            });
        }

        const txn = store.getTransaction(transactionId);
        if (!txn) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        console.log(`[API] /cancel - Txn: ${transactionId}`);

        const result = await becknService.cancel({
            transactionId,
            cancellationReasonId,
            bppId,
            bppUri,
        });

        res.json({
            success: true,
            transactionId,
            messageId: result.messageId,
            status: 'cancelling',
            message: 'Cancellation initiated. Await on_cancel callback.',
        });
    } catch (error) {
        console.error('[API] Cancel error:', error.message);
        res.status(500).json({ error: 'Cancellation failed', details: error.message });
    }
});

module.exports = router;
