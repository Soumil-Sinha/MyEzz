const express = require('express');
const router = express.Router();
const store = require('../store');
const becknService = require('../services/beckn-service');

/**
 * POST /api/select
 * 
 * Mobile app selects a provider/item.
 * Server triggers Beckn /select flow.
 */
router.post('/select', async (req, res) => {
    try {
        const { transactionId, providerId, itemId, fulfillmentId, bppId, bppUri } = req.body;

        if (!transactionId || !providerId || !itemId) {
            return res.status(400).json({
                error: 'transactionId, providerId, and itemId are required',
            });
        }

        const txn = store.getTransaction(transactionId);
        if (!txn) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        console.log(`[API] /select - Provider: ${providerId}, Item: ${itemId}`);

        const result = await becknService.select({
            transactionId,
            providerId,
            itemId,
            fulfillmentId,
            bppId,
            bppUri,
        });

        res.json({
            success: true,
            transactionId,
            messageId: result.messageId,
            status: 'selecting',
            message: 'Select initiated. Await on_select callback.',
        });
    } catch (error) {
        console.error('[API] Select error:', error.message);
        res.status(500).json({ error: 'Select failed', details: error.message });
    }
});

module.exports = router;
