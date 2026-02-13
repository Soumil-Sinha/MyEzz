/**
 * ONDC Logistics BAP - Shared Helpers
 * Utility functions for Beckn protocol compliance
 */

const crypto = require('crypto');

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
    return crypto.randomUUID();
}

/**
 * Generate a unique message_id for each Beckn API call
 * @returns {string} UUID
 */
function generateMessageId() {
    return generateUUID();
}

/**
 * Generate a transaction_id for a Beckn transaction lifecycle
 * @returns {string} UUID
 */
function generateTransactionId() {
    return generateUUID();
}

/**
 * Get current ISO8601 timestamp
 * @returns {string} ISO8601 timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Build a Beckn context object compliant with ONDC v1.2.0
 * @param {object} params - Context parameters
 * @param {string} params.action - Beckn action (search, on_search, etc.)
 * @param {string} params.transactionId - Transaction ID
 * @param {string} [params.messageId] - Message ID (auto-generated if not provided)
 * @param {string} params.bapId - BAP subscriber ID
 * @param {string} params.bapUri - BAP subscriber URL
 * @param {string} [params.bppId] - BPP subscriber ID
 * @param {string} [params.bppUri] - BPP subscriber URL
 * @param {string} [params.domain] - Domain code
 * @param {string} [params.country] - Country code
 * @param {string} [params.city] - City code
 * @param {string} [params.coreVersion] - Core version
 * @param {string} [params.ttl] - Time to live
 * @returns {object} Beckn context object
 */
function buildContext({
    action,
    transactionId,
    messageId,
    bapId,
    bapUri,
    bppId,
    bppUri,
    domain = 'ONDC:LOG10',
    country = 'IND',
    city = 'std:011',
    coreVersion = '1.2.0',
    ttl = 'PT30S',
}) {
    const context = {
        domain,
        country,
        city,
        action,
        core_version: coreVersion,
        bap_id: bapId,
        bap_uri: bapUri,
        transaction_id: transactionId,
        message_id: messageId || generateMessageId(),
        timestamp: getTimestamp(),
        ttl,
    };

    if (bppId) context.bpp_id = bppId;
    if (bppUri) context.bpp_uri = bppUri;

    return context;
}

/**
 * Build a standard ACK response
 * @param {object} context - Beckn context from the incoming request
 * @returns {object} ACK response
 */
function buildAckResponse(context) {
    return {
        context: {
            ...context,
            timestamp: getTimestamp(),
        },
        message: {
            ack: {
                status: 'ACK',
            },
        },
    };
}

/**
 * Build a NACK response
 * @param {object} context - Beckn context from the incoming request
 * @param {string} errorCode - Error code
 * @param {string} errorMessage - Error message
 * @returns {object} NACK response
 */
function buildNackResponse(context, errorCode, errorMessage) {
    return {
        context: {
            ...context,
            timestamp: getTimestamp(),
        },
        message: {
            ack: {
                status: 'NACK',
            },
        },
        error: {
            type: 'DOMAIN-ERROR',
            code: errorCode,
            message: errorMessage,
        },
    };
}

/**
 * Build an on_error callback payload
 * @param {object} context - Beckn context
 * @param {string} errorCode - Error code
 * @param {string} errorMessage - Error message
 * @returns {object} on_error payload
 */
function buildErrorPayload(context, errorCode, errorMessage) {
    return {
        context: {
            ...context,
            action: 'on_error',
            timestamp: getTimestamp(),
        },
        error: {
            type: 'DOMAIN-ERROR',
            code: errorCode,
            message: errorMessage,
        },
    };
}

/**
 * Parse duration string (ISO 8601 duration) to minutes
 * @param {string} duration - ISO 8601 duration (e.g., PT45M, PT1H30M)
 * @returns {number} Duration in minutes
 */
function parseDurationToMinutes(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 60 + minutes + Math.ceil(seconds / 60);
}

/**
 * Validate a Beckn context object
 * @param {object} context - Context to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateContext(context) {
    const errors = [];
    const required = [
        'domain',
        'country',
        'city',
        'action',
        'core_version',
        'bap_id',
        'bap_uri',
        'transaction_id',
        'message_id',
        'timestamp',
    ];

    for (const field of required) {
        if (!context[field]) {
            errors.push(`Missing required field: context.${field}`);
        }
    }

    if (context.domain && context.domain !== 'ONDC:LOG10') {
        errors.push(`Invalid domain: ${context.domain}, expected ONDC:LOG10`);
    }

    if (context.core_version && context.core_version !== '1.2.0') {
        errors.push(`Invalid core_version: ${context.core_version}, expected 1.2.0`);
    }

    return { valid: errors.length === 0, errors };
}

module.exports = {
    generateUUID,
    generateMessageId,
    generateTransactionId,
    getTimestamp,
    buildContext,
    buildAckResponse,
    buildNackResponse,
    buildErrorPayload,
    parseDurationToMinutes,
    validateContext,
};
