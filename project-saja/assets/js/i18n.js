const DEFAULT_LANG = 'en';
const RTL_LANGS = ['ar'];

const detectLang = () => {
  const stored = localStorage.getItem('project-saja-lang');
  if (stored) return stored;
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  return ['en', 'no', 'ar'].includes(browser) ? browser : DEFAULT_LANG;
};

let currentLang = detectLang();

const resolvePath = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);

const fetchTranslations = async (lang) => {
  const basePath = window.location.pathname.includes('/apps/') ? '../i18n/' : 'i18n/';
  const response = await fetch(`${basePath}${lang}.json`);
  if (!response.ok) throw new Error(`Missing translations for ${lang}`);
  return response.json();
};

const applyTranslations = (strings) => {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const scope = el.closest('[data-i18n-scope]')?.dataset.i18nScope;
    const fullKey = scope ? `${scope}.${key}` : key;
    const translation = resolvePath(strings, fullKey);
    if (translation !== undefined) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else if (el.tagName === 'TITLE') {
        document.title = translation;
      } else {
        el.textContent = translation;
      }
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

const setDir = (lang) => {
  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
};

const showToast = (message) => {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
};

const initI18n = async () => {
  try {
    const strings = await fetchTranslations(currentLang);
    applyTranslations(strings);
    setDir(currentLang);
    syncLanguageSwitcher();
    if ('serviceWorker' in navigator) {
      const swPath = window.location.pathname.includes('/project-saja/apps/')
        ? '../sw.js'
        : 'sw.js';
      navigator.serviceWorker.register(swPath).catch((error) => {
        console.error('Service worker registration failed', error);
      });
    }
    document.querySelectorAll('.language-switcher .lang').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const lang = btn.dataset.lang;
        if (lang === currentLang) return;
        currentLang = lang;
        localStorage.setItem('project-saja-lang', currentLang);
        const updated = await fetchTranslations(currentLang);
        applyTranslations(updated);
        setDir(currentLang);
        syncLanguageSwitcher();
      });
    });
  } catch (error) {
    console.error('i18n init failed', error);
  }
};

document.addEventListener('DOMContentLoaded', initI18n);

window.ProjectSaja = {
  showToast,
  get currentLanguage() {
    return currentLang;
  },
};
