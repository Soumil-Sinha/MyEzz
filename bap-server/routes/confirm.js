const express = require('express');
const router = express.Router();
const store = require('../store');
const becknService = require('../services/beckn-service');

/**
 * POST /api/confirm
 * 
 * Mobile app confirms order.
 * Server triggers Beckn /confirm flow.
 */
router.post('/confirm', async (req, res) => {
    try {
        const { transactionId, providerId, itemId, fulfillmentId, bppId, bppUri, billing, payment } = req.body;

        if (!transactionId || !providerId || !itemId) {
            return res.status(400).json({
                error: 'transactionId, providerId, and itemId are required',
            });
        }

        const txn = store.getTransaction(transactionId);
        if (!txn) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        console.log(`[API] /confirm - Provider: ${providerId}, Item: ${itemId}`);

        const result = await becknService.confirm({
            transactionId,
            providerId,
            itemId,
            fulfillmentId,
            bppId,
            bppUri,
            billing,
            payment
        });

        res.json({
            success: true,
            transactionId,
            messageId: result.messageId,
            status: 'confirming',
            message: 'Confirm initiated. Await on_confirm callback.',
        });
    } catch (error) {
        console.error('[API] Confirm error:', error.message);
        res.status(500).json({ error: 'Confirm failed', details: error.message });
    }
});

module.exports = router;
