// Simple helpers to load and save translation JSON files.
// English inline comments; short Hebrew explanation follows file.

const fs = require("fs");
const path = require("path");

/**
 * Load all JSON files from a directory into an object keyed by language code.
 * @param {string} dir - absolute path to translations directory
 * @returns {object} { lang: { key: value } }
 */
function loadTranslations(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  const langs = {};
  for (const file of files) {
    const lang = path.basename(file, ".json");
    const content = JSON.parse(fs.readFileSync(path.join(dir, file)));
    langs[lang] = flatten(content); // שימו לב: שטח כאן
  }
  return langs;
}

/**
 * Save translations object back to files under dir.
 * @param {string} dir - absolute path
 * @param {object} translations - { lang: { key: value } }
 */
function saveTranslations(dir, translations) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (const lang of Object.keys(translations)) {
    const file = path.join(dir, `${lang}.json`);
    fs.writeFileSync(file, JSON.stringify(translations[lang], null, 2), "utf8");
  }
}

/**
 * Collect all unique keys across languages and return sorted array.
 */
function getAllKeys(translations) {
  const keySet = new Set();
  for (const lang of Object.values(translations)) {
    Object.keys(lang).forEach(k => keySet.add(k));
  }
  return Array.from(keySet).sort();
}

function flatten(obj, prefix = "") {
  const res = {};
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(res, flatten(val, newKey));
    } else {
      res[newKey] = val;
    }
  }
  return res;
}

function unflatten(obj) {
  const result = {};
  for (const key in obj) {
    const parts = key.split(".");
    let curr = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        curr[part] = obj[key];
      } else {
        if (!curr[part] || typeof curr[part] !== "object") curr[part] = {};
        curr = curr[part];
      }
    }
  }
  return result;
}


module.exports = { loadTranslations, saveTranslations, getAllKeys, unflatten };
