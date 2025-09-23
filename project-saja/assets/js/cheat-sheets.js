const cheatState = {
  data: null,
  current: null,
};

const loadCheatSheets = async () => {
  const basePath = window.location.pathname.includes('/apps/') ? '../assets/data/' : 'assets/data/';
  const response = await fetch(`${basePath}cheat_sheets.json`);
  cheatState.data = await response.json();
  cheatState.current = cheatState.data.categories[0]?.id ?? null;
  renderCheatCategories();
  renderCheatContent();
};

const getLocalizedTitle = (category) => {
  const lang = window.ProjectSaja?.currentLanguage ?? 'en';
  return category.title[lang] || category.title.en;
};

const renderCheatCategories = () => {
  const list = document.getElementById('cheat-categories');
  if (!list || !cheatState.data) return;
  list.innerHTML = '';
  cheatState.data.categories.forEach((category) => {
    const item = document.createElement('li');
    item.textContent = getLocalizedTitle(category);
    item.tabIndex = 0;
    item.classList.toggle('active', cheatState.current === category.id);
    item.addEventListener('click', () => {
      cheatState.current = category.id;
      renderCheatCategories();
      renderCheatContent();
    });
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        cheatState.current = category.id;
        renderCheatCategories();
        renderCheatContent();
      }
    });
    list.appendChild(item);
  });
};

const renderCheatContent = () => {
  const titleEl = document.getElementById('cheat-title');
  const contentEl = document.getElementById('cheat-content');
  if (!titleEl || !contentEl || !cheatState.data) return;
  const category = cheatState.data.categories.find((cat) => cat.id === cheatState.current);
  if (!category) return;
  titleEl.textContent = getLocalizedTitle(category);
  contentEl.textContent = category.snippets.join('\n\n');
};

const copyCheatSection = async () => {
  const contentEl = document.getElementById('cheat-content');
  if (!contentEl) return;
  try {
    await navigator.clipboard.writeText(contentEl.textContent);
    window.ProjectSaja?.showToast?.('Copied ✅');
  } catch (error) {
    console.error('Copy failed', error);
  }
};

const initCheatSheets = () => {
  const copyButton = document.getElementById('copy-section');
  copyButton?.addEventListener('click', copyCheatSection);
  document.addEventListener('i18n:loaded', () => {
    renderCheatCategories();
    renderCheatContent();
  });
  loadCheatSheets();
};

document.addEventListener('DOMContentLoaded', initCheatSheets);
