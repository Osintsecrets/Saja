# Project Saja

Project Saja is a multilingual, offline-ready cybersecurity utility hub. It bundles cheat sheets, command builders, an evidence logger, reporting studio, practice helpers, and a professional toolkit into a sleek experience tailored for students and consultants.

## Structure

```
/project-saja
├─ index.html
├─ apps/
│  ├─ cheat-sheets.html
│  ├─ commands.html
│  ├─ evidence.html
│  ├─ reports.html
│  ├─ utilities.html
│  ├─ practice.html
│  └─ career.html
├─ assets/
│  ├─ css/
│  ├─ js/
│  └─ data/
├─ i18n/
├─ manifest.json
└─ sw.js
```

Each module shares the neon-on-dark visual identity, supports English, Norwegian, and Arabic strings, and respects RTL layout for Arabic.

## Getting started

Open `project-saja/index.html` in a browser, switch languages with the top bar selector, and explore the module cards. The service worker enables offline caching once served from `http://localhost`.

### Development tips

* Static assets reference relative paths, so keep the folder structure intact.
* Evidence entries are stored locally in the browser via `localStorage`.
* Cheatsheets and command builders consume JSON from `assets/data/` for easy extension.
