#!/usr/bin/env node

// Core modules (CommonJS compatible)
const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { loadTranslations, getAllKeys, saveTranslations, unflatten } = require("./translations");

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
  .option("ignore", {
    type: "string",
    describe: "Comma-separated list of translation files to ignore",
  })
  .help()
  .argv;

// ======================================================
// Utility: Open browser cross-platform (NO external deps)
function openBrowser(url) {
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

const translationsDir = path.resolve(process.cwd(), argv.dir);
const primaryLanguage = argv.main;

// Validate directory exists
if (!fs.existsSync(translationsDir)) {
  console.error("❌ Error: directory not found:", translationsDir);
  process.exit(1);
}

const ignoreFiles = argv.ignore ? argv.ignore.split(",").map(f => f.trim()) : [];
if (ignoreFiles.length) console.log("🚫 Ignoring files:", ignoreFiles);

console.log(`📁 Using translations directory: ${translationsDir}`);
console.log(`🗣 Main language: ${primaryLanguage}`);
console.log(`🚀 Starting backend server...`);

const app = express();
app.use(express.json());

const frontendDist = path.join(__dirname, "frontend", "dist");

// Serve UI
app.use(express.static(frontendDist));

// ============================================
// Endpoint: Get all translations
// ============================================
app.get("/api/translations", (req, res) => {
  const translations = loadTranslations(translationsDir, ignoreFiles); // pass ignore list
  const allKeys = getAllKeys(translations);
  const mainLang = req.query.main || primaryLanguage;
  res.json({ translations, allKeys, mainLang });
});

// ============================================
// Endpoint: Save file
// ============================================
app.post("/api/save", (req, res) => {
  const { translations } = req.body || {};
  if (!translations || typeof translations !== "object") {
    return res.status(400).json({ ok: false, error: "Missing translations in body" });
  }
  try {
    const unflattenedTranslations = {};
    for (const lang in translations) {
      unflattenedTranslations[lang] = unflatten(translations[lang]);
    }

    for (const lang in unflattenedTranslations) {
      const filePath = path.join(translationsDir, `${lang}.json`);
      if (ignoreFiles.includes(`${lang}.json`)) continue; // skip ignored files
      fs.writeFileSync(filePath, JSON.stringify(unflattenedTranslations[lang], null, 2));
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// Serve UI (static HTML file)
// ============================================
app.use("/", express.static(path.join(__dirname, "public")));

const port = 3124;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  openBrowser(`http://localhost:${port}`);
});
