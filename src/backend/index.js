#!/usr/bin/env node

// Core modules (CommonJS compatible)
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require('cors');
const { loadTranslations, getAllKeys, unflatten } = require("./translations");
const { translationsDir, openBrowser, primaryLanguage } = require("../cli");

const app = express();
app.use(cors());
app.use(express.json());

const frontendDist = path.join(__dirname, "..", "client", "dist");
console.log('frontendDist', frontendDist);

// Serve UI
app.use(express.static(frontendDist));

// ============================================
// Endpoint: Get all translations
// ============================================
app.get("/api/translations", (req, res) => {
  const translations = loadTranslations(translationsDir);
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

app.post("/api/update-translation", async (req, res) => {
  try {
    const { key, values } = req.body;

    if (!key || !values) {
      return res.status(400).json({ error: "Missing key or values" });
    }

    const fs = require("fs");
    const path = require("path");

    const langs = Object.keys(values);

    for (const lang of langs) {
      const filePath = path.join(translationsDir, `${lang}.json`);

      // Load file (create if missing)
      let obj = {};
      if (fs.existsSync(filePath)) {
        obj = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }

      // Update nested value
      setNestedValue(obj, key, values[lang]);

      // Save file
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Update failed" });
  }
});


app.post("/api/save-translations", (req, res) => {
  const { translations } = req.body;
  if (!translations || typeof translations !== "object") {
    return res.status(400).json({ ok: false, error: "Missing translations" });
  }

  try {
    for (const lang in translations) {
      const keys = Object.keys(translations[lang]);
      keys.forEach(key => {
        const filePath = path.join(translationsDir, `${lang}.json`);
        let currentData = {};
        if (fs.existsSync(filePath)) {
          currentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        }
        currentData[key] = translations[lang][key];
        fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================
// Serve UI (static HTML file)
// ============================================

const port = 3124;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  openBrowser(`http://localhost:${port}`);
});

function setNestedValue(obj, path, value) {
  console.log({obj, path, value});
  
  const keys = path.split('.');
  let current = obj;
  
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value; // final key → set value
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}; // create missing level
      }
      current = current[key];
    }
  });
}
