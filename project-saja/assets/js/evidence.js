const EVIDENCE_KEY = 'project-saja-evidence';

const evidenceState = {
  entries: [],
  filters: {
    search: '',
    tag: 'all',
  },
};

const loadEvidence = () => {
  const stored = localStorage.getItem(EVIDENCE_KEY);
  if (stored) {
    try {
      evidenceState.entries = JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse evidence log', error);
      evidenceState.entries = [];
    }
  }
  renderEvidence();
  populateTagFilter();
};

const saveEvidence = () => {
  localStorage.setItem(EVIDENCE_KEY, JSON.stringify(evidenceState.entries));
};

const hashFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const formToEntry = async (form) => {
  const formData = new FormData(form);
  const tags = formData
    .get('tags')
    ?.split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const files = form.files?.files ? Array.from(form.files.files) : [];
  const hashedFiles = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      size: file.size,
      hash: await hashFile(file),
    }))
  );
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    caseId: formData.get('case'),
    command: formData.get('command'),
    notes: formData.get('notes'),
    tags: tags ?? [],
    files: hashedFiles,
  };
};

const renderEvidence = () => {
  const list = document.getElementById('evidence-list');
  if (!list) return;
  list.innerHTML = '';
  const filtered = evidenceState.entries.filter((entry) => {
    const matchesTag =
      evidenceState.filters.tag === 'all' || entry.tags.includes(evidenceState.filters.tag);
    const matchesSearch =
      !evidenceState.filters.search ||
      entry.command.toLowerCase().includes(evidenceState.filters.search) ||
      entry.notes.toLowerCase().includes(evidenceState.filters.search) ||
      entry.caseId.toLowerCase().includes(evidenceState.filters.search);
    return matchesTag && matchesSearch;
  });
  filtered.forEach((entry) => {
    const item = document.createElement('li');
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<span>${new Date(entry.createdAt).toLocaleString()}</span><span>${entry.caseId}</span>`;
    const command = document.createElement('pre');
    command.textContent = entry.command;
    const notes = document.createElement('p');
    notes.textContent = entry.notes;
    const tags = document.createElement('p');
    tags.className = 'muted';
    tags.textContent = entry.tags.join(', ');
    item.append(meta, command, notes, tags);
    if (entry.files.length) {
      const fileList = document.createElement('ul');
      fileList.className = 'checklist';
      entry.files.forEach((file) => {
        const li = document.createElement('li');
        li.textContent = `${file.name} · ${file.hash.slice(0, 12)}…`;
        fileList.appendChild(li);
      });
      item.appendChild(fileList);
    }
    list.appendChild(item);
  });
};

const populateTagFilter = () => {
  const select = document.getElementById('tag-filter');
  if (!select) return;
  const tags = new Set(['all']);
  evidenceState.entries.forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));
  select.innerHTML = '';
  tags.forEach((tag) => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag === 'all' ? 'All tags' : tag;
    select.appendChild(option);
  });
  select.value = evidenceState.filters.tag;
};

const exportMarkdown = () => {
  const lines = evidenceState.entries.map((entry) => {
    const header = `### ${entry.caseId} · ${new Date(entry.createdAt).toISOString()}`;
    const body = [
      `- Command: \`${entry.command}\``,
      `- Notes: ${entry.notes}`,
      `- Tags: ${entry.tags.join(', ') || '—'}`,
    ];
    if (entry.files.length) {
      body.push('- Files:');
      entry.files.forEach((file) => body.push(`  - ${file.name} (${file.hash})`));
    }
    return [header, ...body, ''].join('\n');
  });
  downloadFile('evidence.md', ['# Evidence Log', '', ...lines].join('\n'));
};

const exportCsv = () => {
  const header = ['timestamp', 'caseId', 'command', 'notes', 'tags', 'files'];
  const rows = evidenceState.entries.map((entry) => {
    const files = entry.files.map((file) => `${file.name}(${file.hash})`).join(' | ');
    return [
      entry.createdAt,
      entry.caseId.replaceAll('"', '""'),
      entry.command.replaceAll('"', '""'),
      entry.notes.replaceAll('"', '""'),
      entry.tags.join(';'),
      files,
    ];
  });
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(','))
    .join('\n');
  downloadFile('evidence.csv', csv);
};

const downloadFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const initEvidence = () => {
  const form = document.getElementById('evidence-form');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const entry = await formToEntry(form);
      evidenceState.entries.unshift(entry);
      saveEvidence();
      renderEvidence();
      populateTagFilter();
      form.reset();
      window.ProjectSaja?.showToast?.('Saved ✅');
    });
  }
  document.getElementById('search')?.addEventListener('input', (event) => {
    evidenceState.filters.search = event.target.value.trim().toLowerCase();
    renderEvidence();
  });
  document.getElementById('tag-filter')?.addEventListener('change', (event) => {
    evidenceState.filters.tag = event.target.value;
    renderEvidence();
  });
  document.getElementById('export-markdown')?.addEventListener('click', exportMarkdown);
  document.getElementById('export-csv')?.addEventListener('click', exportCsv);
  loadEvidence();
};

document.addEventListener('DOMContentLoaded', initEvidence);
