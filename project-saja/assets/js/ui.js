const createToastContainer = () => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
};

const toastState = {
  queue: [],
  active: null,
};

const renderToast = () => {
  const container = createToastContainer();
  if (toastState.active) return;
  const next = toastState.queue.shift();
  if (!next) return;
  toastState.active = next;
  container.classList.add('has-toast');

  const toast = document.createElement('div');
  toast.className = `toast toast-${next.type}`;
  toast.tabIndex = 0;
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon" aria-hidden="true">${next.icon}</span>
      <p>${next.message}</p>
    </div>
    <button class="toast-close" aria-label="${next.closeLabel}">×</button>
  `;

  const dismiss = () => {
    if (!toastState.active) return;
    toast.classList.add('toast-leave');
    setTimeout(() => {
      toast.remove();
      toastState.active = null;
      if (!container.childElementCount) {
        container.classList.remove('has-toast');
      }
      renderToast();
    }, 180);
  };

  toast.querySelector('.toast-close')?.addEventListener('click', dismiss);

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('toast-enter');
    toast.focus();
  });

  if (next.duration > 0) {
    setTimeout(dismiss, next.duration);
  }
};

const toastIcons = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '⛔',
};

const toast = (message, type = 'info', options = {}) => {
  const lang = window.ProjectSajaI18n?.currentLanguage || 'en';
  const closeLabel =
    window.ProjectSajaI18n?.t?.('ui.close', lang === 'ar' ? 'إغلاق' : 'Close') ||
    (lang === 'ar' ? 'إغلاق' : 'Close');
  toastState.queue.push({
    message,
    type,
    closeLabel,
    icon: toastIcons[type] || toastIcons.info,
    duration: typeof options.duration === 'number' ? options.duration : 3200,
  });
  renderToast();
};

const copyToClipboard = async (value, messageKey = 'toasts.copied') => {
  try {
    await navigator.clipboard.writeText(value);
    const fallback = 'Copied';
    const message = window.ProjectSajaI18n?.t?.(messageKey, fallback) || fallback;
    toast(message, 'success');
    return true;
  } catch (error) {
    console.error('Copy failed', error);
    toast(window.ProjectSajaI18n?.t?.('toasts.copyError', 'Copy failed'), 'error');
    return false;
  }
};

const debounce = (fn, delay = 250) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn('Storage get failed', error);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Storage set failed', error);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Storage remove failed', error);
    }
  },
};

const confirmDestructive = (messageKey = 'confirm.destructive', onConfirm = () => {}) => {
  const message =
    window.ProjectSajaI18n?.t?.(messageKey, 'Are you sure? This cannot be undone.') ||
    'Are you sure? This cannot be undone.';
  const approve = window.ProjectSajaI18n?.t?.('confirm.ok', 'Confirm') || 'Confirm';
  const cancel = window.ProjectSajaI18n?.t?.('confirm.cancel', 'Cancel') || 'Cancel';

  const dialog = document.createElement('div');
  dialog.className = 'modal-backdrop';
  dialog.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-body">
        <p>${message}</p>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" data-action="cancel">${cancel}</button>
        <button class="btn" data-action="confirm">${approve}</button>
      </div>
    </div>
  `;

  const removeDialog = () => {
    dialog.classList.add('modal-leave');
    setTimeout(() => dialog.remove(), 180);
  };

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      removeDialog();
    }
  });

  dialog.querySelector('[data-action="cancel"]').addEventListener('click', removeDialog);
  dialog.querySelector('[data-action="confirm"]').addEventListener('click', () => {
    onConfirm();
    removeDialog();
  });

  document.body.appendChild(dialog);
  const modal = dialog.querySelector('.modal');
  modal.setAttribute('tabindex', '-1');
  modal.focus();
};

window.ProjectSajaUI = {
  toast,
  copyToClipboard,
  debounce,
  storage,
  confirmDestructive,
};
