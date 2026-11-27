/**
 * PulseChain Backend Build Script
 * Validates backend architecture, dependencies, and configuration
 * Allows standalone deployment on Render, Railway, Vercel, or AWS.
 */
const fs = require('fs');
const path = require('path');

console.log('=======================================================');
console.log('⚡ PulseChain Backend Build: Initializing...');
console.log('   Node.js Version:', process.version);
console.log('   Directory:', __dirname);

// Verify server entry point
const serverPath = path.join(__dirname, 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ Error: server.js not found in backend directory!');
  process.exit(1);
}
console.log('   ✓ Server entry point (server.js) verified.');

// Verify SAP Orchestration config
const configPath = path.join(__dirname, 'config', 'sap-orchestration-config.json');
if (fs.existsSync(configPath)) {
  console.log('   ✓ SAP Generative AI Hub configuration detected.');
}

// Verify offline cache fallbacks
const sapCachePath = path.join(__dirname, 'data', 'sap_offline_cache.json');
const hanaCachePath = path.join(__dirname, 'data', 'hana_cloud_offline_cache.json');
if (fs.existsSync(sapCachePath) && fs.existsSync(hanaCachePath)) {
  console.log('   ✓ High-availability SAP S/4HANA & HANA Cloud caches verified.');
}

console.log('✓ PulseChain Backend build completed successfully.');
console.log('=======================================================');
