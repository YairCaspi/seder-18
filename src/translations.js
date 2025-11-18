// translations.js
const fs = require("fs");
const path = require("path");

/**
 * Flatten nested object { a: { b: c } } -> { "a.b": c }
 */
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

/**
 * Read a single translation file as text and extract the object.
 * Supports JSON, JS, TS.
 */
function loadTranslationFile(filePath) {
  try {
    let text = fs.readFileSync(filePath, "utf8");

    // remove common export statements
    text = text.replace(/export\s+(const|let|var)\s+\w+\s*=\s*/, "")
               .replace(/module\.exports\s*=\s*/, "");

    // trim whitespace
    text = text.trim();

    // Evaluate object safely
    const obj = new Function(`return ${text}`)();
    return flatten(obj);
  } catch (err) {
    console.error(`Error loading translation file ${path.basename(filePath)}: ${err.message}`);
    return {};
  }
}

/**
 * Load all translation files from directory.
 * Supports JSON, JS, TS.
 * Returns { langCode: { key: value } }
 */
function loadTranslations(dir, ignoreFiles = []) {
  const files = fs.readdirSync(dir).filter(f =>
    !ignoreFiles.includes(f) && (f.endsWith(".json") || f.endsWith(".js") || f.endsWith(".ts"))
  );

  const langs = {};
  for (const file of files) {
    const lang = path.basename(file, path.extname(file));
    langs[lang] = loadTranslationFile(path.join(dir, file));
  }

  return langs;
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

module.exports = { loadTranslations, getAllKeys, flatten };
