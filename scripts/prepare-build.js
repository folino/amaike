#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate build information
const now = new Date();
const buildDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
const buildTime = now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
const buildId = `${buildDate.replace(/-/g, '')}-${buildTime.replace(/:/g, '')}`; // YYYYMMDD-HHMMSS

// Read current package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Create build info
const buildInfo = {
  version: packageJson.version,
  buildId: buildId,
  buildDate: buildDate,
  buildTime: buildTime,
  appName: `AmAIke-${packageJson.version}-${buildId}`,
  timestamp: now.toISOString()
};

// Write build info to a file for reference
const buildInfoPath = path.resolve(__dirname, '../build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log('🛠️  Build preparation completed:');
console.log(`   📦 Version: ${buildInfo.version}`);
console.log(`   🆔 Build ID: ${buildInfo.buildId}`);
console.log(`   📅 Date: ${buildInfo.buildDate} ${buildInfo.buildTime}`);
console.log(`   🏷️  App Name: ${buildInfo.appName}`);
console.log(`   📄 Build info saved to: build-info.json`);