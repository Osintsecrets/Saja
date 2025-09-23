const styleGuidePoints = [
  'Use consistent severity labels (Critical/High/Medium/Low).',
  'Include executive summary, methodology, and prioritized findings.',
  'Pair each finding with evidence hashes and reproduction steps.',
  'Highlight business impact before diving into technical detail.',
  'Close with remediation roadmap and validation plan.',
];

const interviewPrompts = [
  {
    question: 'Describe how you would scope and plan an internal network pentest.',
    tip: 'Cover goal alignment, access needs, success criteria, and reporting cadence.',
  },
  {
    question: 'A client refuses to patch a critical finding. What do you do?',
    tip: 'Discuss risk communication, compensating controls, and escalation paths.',
  },
  {
    question: 'Explain the difference between qualitative and quantitative risk.',
    tip: 'Tie back to how you translate findings for executives.',
  },
  {
    question: 'Walk me through a time you automated part of an engagement.',
    tip: 'Mention tooling, ROI, and how it reduced manual toil.',
  },
];

const renderStyleGuide = () => {
  const container = document.getElementById('style-guide');
  if (!container) return;
  const list = document.createElement('ul');
  list.className = 'checklist';
  styleGuidePoints.forEach((point) => {
    const item = document.createElement('li');
    const badge = document.createElement('span');
    badge.textContent = '✔';
    const text = document.createElement('span');
    text.textContent = point;
    item.append(badge, text);
    list.appendChild(item);
  });
  container.appendChild(list);
};

const generateResume = () => {
  const name = document.getElementById('resume-name').value || 'Your Name';
  const summary = document.getElementById('resume-summary').value ||
    'Security analyst focused on resilient offensive testing and measurable remediation.';
  const sections = [
    `# ${name}`,
    `## Summary\n${summary}`,
    '## Core Skills\n- Web application testing\n- Active Directory attacks\n- Report automation',
    '## Highlights\n- Delivered 15+ enterprise pentests with 95% remediation adoption\n- Built reusable tooling that cut evidence handling by 40%\n- Led purple team exercises aligning SOC playbooks',
  ];
  document.getElementById('resume-output').textContent = sections.join('\n\n');
};

const renderInterviewCards = () => {
  const container = document.getElementById('interview-cards');
  if (!container) return;
  container.innerHTML = '';
  interviewPrompts.forEach((prompt) => {
    const card = document.createElement('div');
    card.className = 'card';
    const question = document.createElement('h4');
    question.textContent = prompt.question;
    const tip = document.createElement('p');
    tip.className = 'muted';
    tip.textContent = prompt.tip;
    card.append(question, tip);
    container.appendChild(card);
  });
};

const generatePortfolio = () => {
  const source = document.getElementById('portfolio-source').value.trim();
  if (!source) return;
  const block = document.createElement('section');
  block.innerHTML = `
    <h3>Showcase finding</h3>
    <p>${source}</p>
    <p class="muted">Share this snippet to demonstrate methodology without sensitive data.</p>
  `;
  const container = document.getElementById('portfolio-output');
  container.innerHTML = '';
  container.appendChild(block);
};

const initCareer = () => {
  renderStyleGuide();
  renderInterviewCards();
  document.getElementById('generate-resume')?.addEventListener('click', generateResume);
  document.getElementById('generate-portfolio')?.addEventListener('click', generatePortfolio);
};

document.addEventListener('DOMContentLoaded', initCareer);
