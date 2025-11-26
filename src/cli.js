#!/usr/bin/env node

// Core modules (CommonJS compatible)
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");

// Parse CLI args
const argv = require("yargs/yargs")(process.argv.slice(2))
  .option("dir", {
    alias: "d",
    type: "string",
    demandOption: true,
    describe: "Path to the translations directory",
  })
  .option("main", {
    alias: "m",
    type: "string",
    default: "en",
    describe: "Primary language to show first",
  })
  .help()
  .argv;

// ======================================================
// Utility: Open browser cross-platform (NO external deps)
exports.openBrowser = (url) => {
  const platform = os.platform();

  if (platform === "darwin") {
    exec(`open "${url}"`);
  } else if (platform === "win32") {
    exec(`start "" "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}
// ======================================================

exports.translationsDir = path.resolve(process.cwd(), argv.dir);
exports.primaryLanguage = argv.main;

// Validate directory exists
if (!fs.existsSync(this.translationsDir)) {
  console.error("❌ Error: directory not found:", translationsDir);
  process.exit(1);
}

console.log(`📁 Using translations directory: ${this.translationsDir}`);
console.log(`🗣 Main language: ${this.primaryLanguage}`);
console.log(`🚀 Starting backend server...`);

require('./backend/index');