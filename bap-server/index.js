// This file exists solely to catch Railway deployments that are still configured
// to run "node index.js" (due to caching or configuration lag).
// It simply delegates to the real entry point: app.js
require('./app');
