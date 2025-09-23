const stegTasks = [
  'Inspect metadata with exiftool',
  'Run binwalk for embedded files',
  'Check strings for hidden hints',
  'Try stegseek or zsteg where appropriate',
  'Look for appended archives via hex inspection',
];

const miniApps = [
  {
    title: 'XSS playground',
    description: 'Payloads render below – stays client-side and resets on refresh.',
    render: (container) => {
      const input = document.createElement('input');
      input.className = 'input';
      input.placeholder = '<script>alert(1)</script>';
      const preview = document.createElement('div');
      preview.className = 'content code';
      preview.textContent = 'Preview output';
      input.addEventListener('input', () => {
        preview.innerHTML = input.value;
      });
      container.append(input, preview);
    },
  },
  {
    title: 'LFI sandbox',
    description: 'Simulates vulnerable path resolution against a fixed whitelist.',
    render: (container) => {
      const input = document.createElement('input');
      input.className = 'input';
      input.placeholder = '../../etc/passwd';
      const output = document.createElement('pre');
      const whitelist = {
        '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash',
        '/var/www/html/index.php': '<?php echo "hello"; ?>',
      };
      input.addEventListener('input', () => {
        const sanitized = input.value.replace(/\.\.+/g, '.');
        output.textContent = whitelist[sanitized] || 'File not found (sandboxed)';
      });
      container.append(input, output);
    },
  },
];

const hashLookup = {
  32: 'MD5',
  40: 'SHA-1',
  56: 'SHA-224',
  64: 'SHA-256',
  96: 'SHA-384',
  128: 'SHA-512',
};

const FLAG_HASH = '03c9529ab3146c7425d6c09f7d2049801391ace23443d22aea1ff2f66bfb1f59';

const renderStegChecklist = () => {
  const list = document.getElementById('steg-checklist');
  if (!list) return;
  list.innerHTML = '';
  stegTasks.forEach((task) => {
    const item = document.createElement('li');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const label = document.createElement('span');
    label.textContent = task;
    item.append(checkbox, label);
    list.appendChild(item);
  });
};

const renderMiniApps = () => {
  const container = document.getElementById('mini-apps');
  if (!container) return;
  container.innerHTML = '';
  miniApps.forEach((app) => {
    const card = document.createElement('div');
    card.className = 'card';
    const heading = document.createElement('h3');
    heading.textContent = app.title;
    const desc = document.createElement('p');
    desc.className = 'muted';
    desc.textContent = app.description;
    const body = document.createElement('div');
    body.className = 'card-body';
    app.render(body);
    card.append(heading, desc, body);
    container.appendChild(card);
  });
};

const detectHash = () => {
  const value = document.getElementById('hash-input').value.trim();
  const output = document.getElementById('hash-output');
  if (!value) {
    output.textContent = '';
    return;
  }
  const clean = value.toLowerCase();
  output.textContent = hashLookup[clean.length] || 'Unknown';
};

const validateFlag = async () => {
  const value = document.getElementById('flag-input').value.trim();
  const result = document.getElementById('flag-result');
  if (!value) {
    result.textContent = '';
    return;
  }
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hash === FLAG_HASH) {
    result.textContent = 'Valid flag!';
  } else {
    result.textContent = 'Try again.';
  }
};

const initPractice = () => {
  renderStegChecklist();
  renderMiniApps();
  document.getElementById('detect-hash')?.addEventListener('click', detectHash);
  document.getElementById('validate-flag')?.addEventListener('click', validateFlag);
};

document.addEventListener('DOMContentLoaded', initPractice);
