const express = require('express');
const router = express.Router();
const store = require('../store');
const becknService = require('../services/beckn-service');
const { getTimestamp } = require('../../packages/shared/helpers');

/**
 * POST /api/init
 * 
 * Mobile app initiates order.
 * Server triggers Beckn /init flow.
 */
router.post('/init', async (req, res) => {
    try {
        const { transactionId, providerId, itemId, fulfillmentId, bppId, bppUri, billing } = req.body;

        if (!transactionId || !providerId || !itemId) {
            return res.status(400).json({
                error: 'transactionId, providerId, and itemId are required',
            });
        }

        const txn = store.getTransaction(transactionId);
        if (!txn) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        console.log(`[API] /init - Provider: ${providerId}, Item: ${itemId}`);

        const result = await becknService.init({
            transactionId,
            providerId,
            itemId,
            fulfillmentId,
            bppId,
            bppUri,
            billing,
        });

        res.json({
            success: true,
            transactionId,
            messageId: result.messageId,
            status: 'initializing',
            message: 'Init initiated. Await on_init callback.',
        });
    } catch (error) {
        console.error('[API] Init error:', error.message);
        res.status(500).json({ error: 'Init failed', details: error.message });
    }
});

module.exports = router;
