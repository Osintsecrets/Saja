const DEFAULT_LANG = 'en';
const SUPPORTED_LANGS = ['en', 'no', 'ar'];
const RTL_LANGS = ['ar'];

let currentLang = detectLang();
let translations = {};

function detectLang() {
  const stored = localStorage.getItem('project-saja-lang');
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(browser) ? browser : DEFAULT_LANG;
}

const resolvePath = (obj, path) =>
  path
    .split('.')
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

const getBasePath = () => (window.location.pathname.includes('/apps/') ? '../' : '');

const fetchTranslations = async (lang) => {
  const response = await fetch(`${getBasePath()}i18n/${lang}.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Missing translations for ${lang}`);
  return response.json();
};

const resolveScope = (element) => {
  const segments = [];
  let node = element.parentElement;
  while (node) {
    if (node.dataset?.i18nScope) {
      segments.unshift(node.dataset.i18nScope);
    }
    node = node.parentElement;
  }
  return segments.join('.');
};

const applyTranslations = (strings) => {
  translations = strings;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const scopePrefix = resolveScope(el);
    const fullKey = scopePrefix ? `${scopePrefix}.${key}` : key;
    const translation = resolvePath(strings, fullKey);
    if (translation === undefined) return;

    if (el.dataset.i18nAttr) {
      el.dataset.i18nAttr.split(',').forEach((attr) => {
        el.setAttribute(attr.trim(), translation);
      });
      return;
    }

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = translation;
    } else if (el.tagName === 'TITLE') {
      document.title = translation;
    } else {
      el.textContent = translation;
    }
  });

  document.dispatchEvent(
    new CustomEvent('i18n:loaded', {
      detail: { lang: currentLang },
    })
  );
};

const syncLanguageSwitcher = () => {
  document.querySelectorAll('.language-switcher .lang').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
};

const ensureRtlStylesheet = (lang) => {
  const id = 'rtl-stylesheet';
  const existing = document.getElementById(id);
  const shouldLoad = RTL_LANGS.includes(lang);
  if (shouldLoad && !existing) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = id;
    link.href = `${getBasePath()}assets/css/rtl.css`;
    document.head.appendChild(link);
  } else if (!shouldLoad && existing) {
    existing.remove();
  }
};

const setDir = (lang) => {
  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  document.documentElement.dataset.locale = lang;
  ensureRtlStylesheet(lang);
};

const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;
  const swPath = window.location.pathname.includes('/apps/') ? '../sw.js' : 'sw.js';
  navigator.serviceWorker.register(swPath).catch((error) => {
    console.error('Service worker registration failed', error);
  });
};

const loadLanguage = async (lang) => {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  try {
    const strings = await fetchTranslations(lang);
    currentLang = lang;
    localStorage.setItem('project-saja-lang', currentLang);
    applyTranslations(strings);
    setDir(currentLang);
    syncLanguageSwitcher();
  } catch (error) {
    console.error('i18n load failed', error);
  }
};

const initI18n = async () => {
  await loadLanguage(currentLang);
  registerServiceWorker();

  document.querySelectorAll('.language-switcher .lang').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const lang = btn.dataset.lang;
      if (lang === currentLang) return;
      await loadLanguage(lang);
    });
  });
};

document.addEventListener('DOMContentLoaded', initI18n);

const t = (key, fallback) => resolvePath(translations, key) ?? fallback ?? key;

window.ProjectSajaI18n = {
  t,
  get currentLanguage() {
    return currentLang;
  },
  setLanguage: loadLanguage,
};

window.ProjectSaja = {
  get currentLanguage() {
    return currentLang;
  },
  t,
  showToast(message, type = 'info', options = {}) {
    if (window.ProjectSajaUI?.toast) {
      window.ProjectSajaUI.toast(message, type, options);
    }
  },
  setLanguage: loadLanguage,
};
