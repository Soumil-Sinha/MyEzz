/**
 * Mock Gateway - Simulates ONDC Gateway behavior
 * 
 * In the real ONDC network, the gateway receives requests from BAPs,
 * looks up the registry to find relevant BPPs, and forwards the requests.
 * 
 * This mock simply routes requests to the mock seller (BPP) and
 * triggers asynchronous callbacks to the BAP.
 */

const { handleSearch, handleSelect, handleInit } = require('./mock-seller');

/**
 * Route a request to the appropriate mock seller handler
 * Simulates the gateway's role of forwarding requests.
 * 
 * @param {string} action - Beckn action (search, select, init)
 * @param {object} payload - Complete Beckn request payload
 */
function routeToSeller(action, payload) {
    const transactionId = payload.context?.transaction_id || 'unknown';
    console.log(`[MOCK-GW] Routing /${action} to mock seller - txn: ${transactionId}`);

    // Simulate network delay (500-1500ms)
    const delay = 500 + Math.random() * 1000;

    setTimeout(() => {
        switch (action) {
            case 'search':
                handleSearch(payload);
                break;
            case 'select':
                handleSelect(payload);
                break;
            case 'init':
                handleInit(payload);
                break;
            default:
                console.warn(`[MOCK-GW] Unknown action: ${action}`);
        }
    }, delay);
}

module.exports = {
    routeToSeller,
};
