const builderState = {
  data: null,
  active: null,
};

const loadBuilders = async () => {
  const basePath = window.location.pathname.includes('/apps/') ? '../assets/data/' : 'assets/data/';
  const response = await fetch(`${basePath}command_builders.json`);
  builderState.data = await response.json();
  builderState.active = builderState.data.tools[0]?.id ?? null;
  renderToolList();
  renderBuilder();
};

const renderToolList = () => {
  const list = document.getElementById('builder-tools');
  if (!list || !builderState.data) return;
  list.innerHTML = '';
  builderState.data.tools.forEach((tool) => {
    const button = document.createElement('button');
    button.textContent = tool.name;
    button.type = 'button';
    button.classList.toggle('active', builderState.active === tool.id);
    button.addEventListener('click', () => {
      builderState.active = tool.id;
      renderToolList();
      renderBuilder();
    });
    list.appendChild(button);
  });
};

const renderBuilder = () => {
  const tool = builderState.data?.tools.find((entry) => entry.id === builderState.active);
  const optionsEl = document.getElementById('builder-options');
  const outputEl = document.getElementById('command-output');
  const titleEl = document.getElementById('builder-title');
  const descEl = document.getElementById('builder-desc');
  if (!tool || !optionsEl || !outputEl || !titleEl || !descEl) return;
  titleEl.textContent = tool.name;
  descEl.textContent = tool.description;
  optionsEl.innerHTML = '';
  tool.options.forEach((option, index) => {
    const label = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = option.label;
    label.appendChild(span);
    let input;
    if (option.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.flag = option.flag;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.placeholder = option.placeholder ?? '';
      input.dataset.flag = option.flag;
    }
    input.dataset.index = index;
    input.addEventListener('input', updateCommand);
    input.addEventListener('change', updateCommand);
    label.appendChild(input);
    optionsEl.appendChild(label);
  });
  updateCommand();
};

const updateCommand = () => {
  const tool = builderState.data?.tools.find((entry) => entry.id === builderState.active);
  if (!tool) return;
  const optionsEl = document.getElementById('builder-options');
  const outputEl = document.getElementById('command-output');
  if (!optionsEl || !outputEl) return;
  const pieces = [tool.base];
  optionsEl.querySelectorAll('input').forEach((input) => {
    const flag = input.dataset.flag;
    if (input.type === 'checkbox') {
      if (input.checked && flag) {
        pieces.push(flag);
      }
    } else if (input.value) {
      if (flag) {
        pieces.push(`${flag} ${input.value}`);
      } else {
        pieces.push(input.value);
      }
    }
  });
  outputEl.textContent = pieces.join(' ');
};

const copyCommand = async () => {
  const outputEl = document.getElementById('command-output');
  if (!outputEl) return;
  try {
    await navigator.clipboard.writeText(outputEl.textContent);
    window.ProjectSaja?.showToast?.('Copied ✅');
  } catch (error) {
    console.error('Copy failed', error);
  }
};

const initBuilders = () => {
  document.getElementById('copy-command')?.addEventListener('click', copyCommand);
  loadBuilders();
};

document.addEventListener('DOMContentLoaded', initBuilders);
