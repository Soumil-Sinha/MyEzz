const express = require('express');
const router = express.Router();
const crypto = require('../crypto');

/**
 * POST /on_subscribe
 * 
 * Callback from ONDC Registry after calling /subscribe API.
 * Registry sends an encrypted challenge string.
 * We must decrypt it and send it back in the response.
 */
router.post('/on_subscribe', async (req, res) => {
    try {
        const { challenge } = req.body;

        console.log('[BECKN] /on_subscribe received');

        if (!challenge) {
            return res.status(400).json({
                error: 'Challenge string missing'
            });
        }

        // Get keys from env
        const ondcPublicKey = process.env.ONDC_PUBLIC_KEY;
        const myPrivateKey = process.env.ENCRYPTION_PRIVATE_KEY;

        if (!ondcPublicKey || !myPrivateKey) {
            console.error('[BECKN] Missing keys for decryption. Check .env configuration.');
            return res.status(500).json({ error: 'Server misconfiguration' });
        }

        console.log('[BECKN] Decrypting challenge...');
        const decryptedChallenge = crypto.decryptChallenge(challenge, ondcPublicKey, myPrivateKey);

        if (!decryptedChallenge) {
            console.error('[BECKN] Failed to decrypt challenge');
            return res.status(500).json({ error: 'Decryption failed' });
        }

        console.log(`[BECKN] Challenge decrypted successfully: ${decryptedChallenge}`);

        // ONDC expects: { answer: "decrypted_string" }
        res.json({
            answer: decryptedChallenge
        });

    } catch (error) {
        console.error('[BECKN] /on_subscribe error:', error.message);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

module.exports = router;
