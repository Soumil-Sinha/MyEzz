const express = require('express');
const router = express.Router();
const store = require('../store');
const becknService = require('../services/beckn-service');

/**
 * POST /api/search
 * 
 * Mobile app sends pickup/drop locations.
 * Server triggers Beckn /search flow and returns transaction_id.
 * Mobile app then polls /api/results/:transactionId for results.
 * 
 * Body: { pickup: { address, gps, ... }, drop: { address, gps, ... } }
 */
router.post('/search', async (req, res) => {
    try {
        const { pickup, drop } = req.body;

        if (!pickup || !drop) {
            return res.status(400).json({
                error: 'Both pickup and drop locations are required',
            });
        }

        console.log('[API] /search request received');
        console.log('[API] Pickup:', pickup.address || pickup.gps);
        console.log('[API] Drop:', drop.address || drop.gps);

        // Trigger Beckn /search
        const { transactionId, messageId, response } = await becknService.search({
            pickup,
            drop,
        });

        // Create transaction in store
        store.createTransaction(transactionId, messageId, { pickup, drop });

        console.log(`[API] Search initiated - txn: ${transactionId}`);

        res.json({
            success: true,
            transactionId,
            messageId,
            status: 'searching',
            message: 'Search initiated. Poll /api/results/:transactionId for results.',
        });
    } catch (error) {
        console.error('[API] Search error:', error.message);
        res.status(500).json({
            error: 'Search failed',
            details: error.message,
        });
    }
});

/**
 * GET /api/results/:transactionId
 * 
 * Mobile app polls this endpoint for search results.
 * Returns providers once on_search callbacks have been received.
 */
router.get('/results/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const txn = store.getTransaction(transactionId);

    if (!txn) {
        return res.status(404).json({
            error: 'Transaction not found',
            transactionId,
        });
    }

    // Flatten catalog data into a simpler format for mobile
    const providers = [];
    for (const catalog of txn.catalogs) {
        if (catalog.message && catalog.message.catalog) {
            const bppProviders = catalog.message.catalog['bpp/providers'] || [];
            for (const provider of bppProviders) {
                for (const item of provider.items || []) {
                    const fulfillment = (provider.fulfillments || []).find(
                        (f) => f.id === item.fulfillment_id
                    );

                    providers.push({
                        id: provider.id,
                        name: provider.descriptor?.name || 'Unknown',
                        shortDesc: provider.descriptor?.short_desc || '',
                        logoUrl: provider.descriptor?.images?.[0]?.url || '',
                        itemId: item.id,
                        itemName: item.descriptor?.name || 'Delivery',
                        price: parseFloat(item.price?.value || '0'),
                        currency: item.price?.currency || 'INR',
                        eta: item.time?.duration || 'PT60M',
                        etaMinutes: parseDuration(item.time?.duration || 'PT60M'),
                        vehicleCategory: fulfillment?.vehicle?.category || 'Bike',
                        fulfillmentId: fulfillment?.id || '',
                        fulfillmentType: fulfillment?.type || 'Delivery',
                        bppId: catalog.context?.bpp_id || '',
                        bppUri: catalog.context?.bpp_uri || '',
                        tags: item.tags || [],
                    });
                }
            }
        }
    }

    // Sort by price (cheapest first)
    providers.sort((a, b) => a.price - b.price);

    // Mark cheapest
    if (providers.length > 0) {
        providers[0].isCheapest = true;
    }

    res.json({
        transactionId,
        status: txn.status,
        providers,
        providerCount: providers.length,
        updatedAt: txn.updatedAt,
    });
});

/**
 * Parse ISO 8601 duration to minutes
 */
function parseDuration(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 60;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
}

module.exports = router;
