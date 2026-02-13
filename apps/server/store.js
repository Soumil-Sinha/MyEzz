/**
 * In-Memory Store for BAP Server
 * 
 * Maintains transaction state, catalogs, and selections.
 * No database required — all state is held in memory.
 * 
 * Structure:
 *  transactions[transactionId] = {
 *    transactionId,
 *    messageId,
 *    status,       // 'searching' | 'results_ready' | 'selected' | 'initialized' | 'confirmed' | 'error'
 *    search,       // original search request body
 *    catalogs,     // array of on_search results (providers)
 *    selections,   // select results
 *    initResults,  // init results
 *    statusResults,// status results
 *    errors,       // error results
 *    createdAt,
 *    updatedAt,
 *  }
 */

const store = {
    transactions: {},
};

/**
 * Create a new transaction entry
 * @param {string} transactionId 
 * @param {string} messageId 
 * @param {object} searchPayload 
 */
function createTransaction(transactionId, messageId, searchPayload) {
    store.transactions[transactionId] = {
        transactionId,
        messageId,
        status: 'searching',
        search: searchPayload,
        catalogs: [],
        selections: [],
        initResults: [],
        statusResults: [],
        errors: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return store.transactions[transactionId];
}

/**
 * Get a transaction by ID
 * @param {string} transactionId 
 * @returns {object|null}
 */
function getTransaction(transactionId) {
    return store.transactions[transactionId] || null;
}

/**
 * Update transaction with on_search catalog data
 * @param {string} transactionId 
 * @param {object} catalogData - Provider catalog from on_search
 */
function addCatalogData(transactionId, catalogData) {
    const txn = store.transactions[transactionId];
    if (!txn) return null;

    txn.catalogs.push(catalogData);
    txn.status = 'results_ready';
    txn.updatedAt = new Date().toISOString();
    return txn;
}

/**
 * Update transaction with on_select data
 * @param {string} transactionId 
 * @param {object} selectData 
 */
function addSelectData(transactionId, selectData) {
    const txn = store.transactions[transactionId];
    if (!txn) return null;

    txn.selections.push(selectData);
    txn.status = 'selected';
    txn.updatedAt = new Date().toISOString();
    return txn;
}

/**
 * Update transaction with on_init data
 * @param {string} transactionId 
 * @param {object} initData 
 */
function addInitData(transactionId, initData) {
    const txn = store.transactions[transactionId];
    if (!txn) return null;

    txn.initResults.push(initData);
    txn.status = 'initialized';
    txn.updatedAt = new Date().toISOString();
    return txn;
}

/**
 * Update transaction with on_status data
 * @param {string} transactionId 
 * @param {object} statusData 
 */
function addStatusData(transactionId, statusData) {
    const txn = store.transactions[transactionId];
    if (!txn) return null;

    txn.statusResults.push(statusData);
    txn.updatedAt = new Date().toISOString();
    return txn;
}

/**
 * Update transaction with on_error data
 * @param {string} transactionId 
 * @param {object} errorData 
 */
function addErrorData(transactionId, errorData) {
    const txn = store.transactions[transactionId];
    if (!txn) return null;

    txn.errors.push(errorData);
    txn.status = 'error';
    txn.updatedAt = new Date().toISOString();
    return txn;
}

/**
 * Get all transaction IDs
 * @returns {string[]}
 */
function getAllTransactionIds() {
    return Object.keys(store.transactions);
}

/**
 * Clear all data (for testing)
 */
function clearAll() {
    store.transactions = {};
}

module.exports = {
    store,
    createTransaction,
    getTransaction,
    addCatalogData,
    addSelectData,
    addInitData,
    addStatusData,
    addErrorData,
    getAllTransactionIds,
    clearAll,
};
