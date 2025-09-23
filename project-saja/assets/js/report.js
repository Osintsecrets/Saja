const templateOptions = {
  en: [{ id: 'default', label: 'Standard pentest report', file: 'templates.en.md' }],
  no: [{ id: 'default', label: 'Standard pentest rapport', file: 'templates.no.md' }],
  ar: [{ id: 'default', label: 'تقرير اختبار اختراق قياسي', file: 'templates.ar.md' }],
};

const REPORT_BASE = window.location.pathname.includes('/apps/') ? '../assets/data/' : 'assets/data/';

const state = {
  lang: 'en',
  template: 'default',
  redaction: false,
};

const loadTemplates = () => {
  const list = document.getElementById('template-list');
  if (!list) return;
  list.innerHTML = '';
  templateOptions[state.lang].forEach((template) => {
    const item = document.createElement('li');
    item.textContent = template.label;
    item.classList.toggle('active', state.template === template.id);
    item.addEventListener('click', () => {
      state.template = template.id;
      loadTemplateContent();
      loadTemplates();
    });
    list.appendChild(item);
  });
};

const loadTemplateContent = async () => {
  const template = templateOptions[state.lang].find((item) => item.id === state.template);
  if (!template) return;
  const response = await fetch(`${REPORT_BASE}${template.file}`);
  const content = await response.text();
  const editor = document.getElementById('report-editor');
  if (editor) {
    editor.value = content;
    renderPreview();
  }
};

const formatInline = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

const simpleMarkdown = (markdown) => {
  const escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const lines = escaped.split(/\r?\n/);
  const html = [];
  let inList = false;
  lines.forEach((line) => {
    if (!line.trim()) {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      return;
    }
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      const level = headingMatch[1].length;
      html.push(`<h${level}>${formatInline(headingMatch[2])}</h${level}>`);
      return;
    }
    if (line.startsWith('- ')) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${formatInline(line.slice(2))}</li>`);
      return;
    }
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
    html.push(`<p>${formatInline(line)}</p>`);
  });
  if (inList) {
    html.push('</ul>');
  }
  return html.join('');
};

const renderPreview = () => {
  const editor = document.getElementById('report-editor');
  const preview = document.getElementById('report-preview');
  if (!editor || !preview) return;
  preview.innerHTML = simpleMarkdown(editor.value);
};

const redactContent = (text) => {
  const ipPattern = /(?<!\d)(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}/g;
  const domainPattern = /\b([a-z0-9-]+\.)+[a-z]{2,}\b/gi;
  return text.replace(ipPattern, '[REDACTED-IP]').replace(domainPattern, '[REDACTED-DOMAIN]');
};

const insertEvidence = () => {
  const editor = document.getElementById('report-editor');
  if (!editor) return;
  const stored = localStorage.getItem('project-saja-evidence');
  if (!stored) return;
  try {
    const entries = JSON.parse(stored);
    const chunks = entries.slice(0, 5).map((entry) => {
      return [
        `## ${entry.caseId}`,
        `- Timestamp: ${entry.createdAt}`,
        `- Command: \`${entry.command}\``,
        `- Notes: ${entry.notes}`,
        entry.tags.length ? `- Tags: ${entry.tags.join(', ')}` : '',
        '',
      ].join('\n');
    });
    editor.value += `\n${chunks.join('\n')}`;
    renderPreview();
  } catch (error) {
    console.error('Failed to insert evidence', error);
  }
};

const exportMarkdownReport = () => {
  const editor = document.getElementById('report-editor');
  if (!editor) return;
  const blob = new Blob([editor.value], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'project-saja-report.md';
  link.click();
  URL.revokeObjectURL(url);
};

const exportPdfReport = () => {
  const editor = document.getElementById('report-editor');
  if (!editor) return;
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Project Saja Report</title><link rel="stylesheet" href="${
    window.location.pathname.includes('/apps/') ? '../assets/css/theme.css' : 'assets/css/theme.css'
  }" /></head><body><main class="content">${simpleMarkdown(editor.value)}</main></body></html>`);
  win.document.close();
  win.focus();
  win.print();
};

const roundUp1 = (num) => {
  const int = Math.ceil(num * 10);
  return int / 10;
};

const cvssMetrics = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  PR: {
    U: { N: 0.85, L: 0.62, H: 0.27 },
    C: { N: 0.85, L: 0.68, H: 0.5 },
  },
  UI: { N: 0.85, R: 0.62 },
  S: { U: 'U', C: 'C' },
  C: { H: 0.56, L: 0.22, N: 0 },
  I: { H: 0.56, L: 0.22, N: 0 },
  A: { H: 0.56, L: 0.22, N: 0 },
};

const cvssSeverity = (score) => {
  if (score === 0) return 'None';
  if (score <= 3.9) return 'Low';
  if (score <= 6.9) return 'Medium';
  if (score <= 8.9) return 'High';
  return 'Critical';
};

const calculateCvss = () => {
  const input = document.getElementById('cvss-vector');
  const output = document.getElementById('cvss-score');
  if (!input || !output) return;
  try {
    const vector = input.value.trim();
    if (!vector) throw new Error('Vector required');
    const metrics = {};
    vector
      .replace('CVSS:3.1/', '')
      .split('/')
      .forEach((token) => {
        const [metric, value] = token.split(':');
        metrics[metric] = value;
      });
    const scope = metrics.S || 'U';
    const iss = 1 - (1 - cvssMetrics.C[metrics.C || 'N']) * (1 - cvssMetrics.I[metrics.I || 'N']) * (1 - cvssMetrics.A[metrics.A || 'N']);
    const impact =
      scope === 'U'
        ? 6.42 * iss
        : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
    const exploitability =
      8.22 *
      cvssMetrics.AV[metrics.AV || 'N'] *
      cvssMetrics.AC[metrics.AC || 'L'] *
      cvssMetrics.PR[scope][metrics.PR || 'N'] *
      cvssMetrics.UI[metrics.UI || 'N'];
    const baseScore = impact <= 0 ? 0 : scope === 'U' ? Math.min(roundUp1(impact + exploitability), 10) : Math.min(roundUp1(1.08 * (impact + exploitability)), 10);
    output.textContent = `${baseScore.toFixed(1)} · ${cvssSeverity(baseScore)}`;
  } catch (error) {
    output.textContent = '—';
    console.error('CVSS calculation failed', error);
  }
};

const applyRedaction = () => {
  const editor = document.getElementById('report-editor');
  if (!editor) return;
  if (!state.redaction) {
    state.snapshot = editor.value;
    editor.value = redactContent(editor.value);
  } else if (state.snapshot) {
    editor.value = state.snapshot;
  }
  state.redaction = !state.redaction;
  renderPreview();
};

const initReportStudio = () => {
  const languageSelect = document.getElementById('template-language');
  languageSelect?.addEventListener('change', (event) => {
    state.lang = event.target.value;
    state.template = 'default';
    loadTemplates();
    loadTemplateContent();
  });
  document.getElementById('insert-evidence')?.addEventListener('click', insertEvidence);
  document.getElementById('export-markdown-report')?.addEventListener('click', exportMarkdownReport);
  document.getElementById('export-pdf-report')?.addEventListener('click', exportPdfReport);
  document.getElementById('calc-cvss')?.addEventListener('click', calculateCvss);
  document.getElementById('apply-redaction')?.addEventListener('click', applyRedaction);
  document.getElementById('report-editor')?.addEventListener('input', renderPreview);
  loadTemplates();
  loadTemplateContent();
};

document.addEventListener('DOMContentLoaded', initReportStudio);
