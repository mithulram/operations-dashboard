#!/usr/bin/env node

const major = Number(process.versions.node.split('.')[0]);
if (!Number.isFinite(major) || major < 22) {
  console.error('Node 22+ is required. Run nvm use or install Node 22.');
  process.exit(1);
}
