/**
 * API Service for mobile app
 * Communicates with the BAP backend server
 */

// Change this to your BAP server URL
// For Android emulator use 10.0.2.2, for iOS simulator use localhost
const API_BASE_URL = 'http://10.0.2.2:3000';

// Fallback URLs for different environments
const API_URLS = {
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    web: 'http://localhost:3000',
};

import { Platform } from 'react-native';

function getBaseUrl() {
    if (Platform.OS === 'android') return API_URLS.android;
    if (Platform.OS === 'ios') return API_URLS.ios;
    return API_URLS.web;
}

/**
 * Search for logistics providers
 * @param {object} params - { pickup: { address, gps }, drop: { address, gps } }
 * @returns {Promise<{ transactionId: string, status: string }>}
 */
export async function searchProviders(pickup, drop) {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickup, drop }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Search failed' }));
        throw new Error(error.error || 'Search failed');
    }

    return response.json();
}

/**
 * Get search results by transaction ID
 * @param {string} transactionId
 * @returns {Promise<{ providers: Array, status: string }>}
 */
export async function getResults(transactionId) {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/results/${transactionId}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch results' }));
        throw new Error(error.error || 'Failed to fetch results');
    }

    return response.json();
}

/**
 * Select a provider
 * @param {object} params - Selection parameters
 * @returns {Promise<object>}
 */
export async function selectProvider(params) {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Select failed' }));
        throw new Error(error.error || 'Select failed');
    }

    return response.json();
}

/**
 * Initialize an order
 * @param {object} params - Init parameters
 * @returns {Promise<object>}
 */
export async function initOrder(params) {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Init failed' }));
        throw new Error(error.error || 'Init failed');
    }

    return response.json();
}

/**
 * Health check
 * @returns {Promise<object>}
 */
export async function healthCheck() {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/health`);
    return response.json();
}
