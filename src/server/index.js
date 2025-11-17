// Express server that serves API and static built frontend.
// Inline comments are in English; Hebrew notes below.

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const { loadTranslations, saveTranslations, getAllKeys } = require("../translations");

/**
 * Start the server.
 * @param {string} translationsDir - absolute path to folder with JSON files
 * @param {string} mainLang - which language to show first
 * @param {number} port
 */
function startServer(translationsDir, mainLang = "en", port = 3124) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  const frontendDist = path.join(__dirname, "..", "frontend", "dist");

  // Serve UI
  app.use(express.static(frontendDist));

  app.get("/ui", (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  })

  // GET /api/translations -> returns translations, keys, mainLang
  app.get("/api/translations", (req, res) => {
    const translations = loadTranslations(translationsDir); // object: lang -> { key: value }
    const allKeys = getAllKeys(translations);
    const mainLang = req.query.main || "en";
    res.json({ translations, allKeys, mainLang });
  });

  // POST /api/save-translations -> body: { translations }
  app.post("/api/save-translations", (req, res) => {
    const { translations } = req.body || {};
    if (!translations || typeof translations !== "object") {
      return res.status(400).json({ ok: false, error: "Missing translations in body" });
    }
    try {
      saveTranslations(translationsDir, translations);
      res.json({ ok: true });
    } catch (err) {
      console.error("Failed to save:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // // Serve built frontend if exists (frontend/dist)

  // if (fs.existsSync(frontendDist)) {
  //   app.use(express.static(frontendDist));
  //   // For SPA routing - serve index.html for unknown paths
  //   app.get("/", (req, res) => {
  //     console.log('PATH', path.join(__dirname, "frontend", "dist"));

  //     res.sendFile(path.join(frontendDist, "index.html"));
  //   });
  //   console.log("Serving static UI from:", frontendDist);
  // } else {
  //   // If no built UI, expose simple placeholder page with link to API
  //   app.get("/", (req, res) => {
  //     res.type("text").send(
  //       "No built UI found. Please build the frontend (cd frontend && npm run build) or run the dev UI separately."
  //     );
  //   });
  // }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = { startServer };
