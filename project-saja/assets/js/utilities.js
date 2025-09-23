const codecHandlers = {
  base64: {
    encode: (value) => btoa(unescape(encodeURIComponent(value))),
    decode: (value) => decodeURIComponent(escape(atob(value))),
  },
  url: {
    encode: (value) => encodeURIComponent(value),
    decode: (value) => decodeURIComponent(value),
  },
  rot13: {
    encode: (value) => value.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
    }),
    decode: (value) => value.replace(/[a-zA-Z]/g, (char) => {
      const base = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
    }),
  },
  hex: {
    encode: (value) => Array.from(new TextEncoder().encode(value)).map((b) => b.toString(16).padStart(2, '0')).join(''),
    decode: (value) => {
      const bytes = value.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16));
      if (!bytes) return '';
      return new TextDecoder().decode(new Uint8Array(bytes));
    },
  },
};

const handleCodec = (mode) => {
  const type = document.getElementById('codec-type').value;
  const input = document.getElementById('codec-input').value;
  const output = document.getElementById('codec-output');
  if (!codecHandlers[type] || !output) return;
  try {
    output.textContent = codecHandlers[type][mode](input);
    window.ProjectSaja?.showToast?.('Done ✅');
  } catch (error) {
    output.textContent = 'Error';
    console.error('Codec failure', error);
  }
};

const testRegex = () => {
  const patternInput = document.getElementById('regex-pattern').value.trim();
  const sample = document.getElementById('regex-test').value;
  const output = document.getElementById('regex-result');
  try {
    const matches = patternInput.match(/^\/(.*)\/(.*)$/);
    if (!matches) throw new Error('Use /pattern/flags format');
    const regex = new RegExp(matches[1], matches[2]);
    const result = sample.match(regex);
    output.textContent = result ? JSON.stringify(result, null, 2) : 'No match';
  } catch (error) {
    output.textContent = error.message;
  }
};

const convertTimestamp = () => {
  const value = document.getElementById('timestamp-input').value.trim();
  const output = document.getElementById('time-output');
  if (!value) return;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) {
    const date = new Date((value.length === 13 ? asNumber : asNumber * 1000));
    output.textContent = `${date.toISOString()} (${date.toLocaleString()})`;
  } else {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      output.textContent = 'Invalid date';
    } else {
      output.textContent = Math.floor(date.getTime() / 1000).toString();
    }
  }
};

const generateUuid = () => {
  document.getElementById('uuid-output').textContent = crypto.randomUUID();
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const array = new Uint32Array(24);
  crypto.getRandomValues(array);
  const password = Array.from(array, (value) => chars[value % chars.length]).join('');
  document.getElementById('uuid-output').textContent = password;
};

const updateHttpBuilder = () => {
  const method = document.getElementById('http-method').value;
  const url = document.getElementById('http-url').value;
  const body = document.getElementById('http-body').value;
  const output = document.getElementById('http-output');
  const parts = [`curl -X ${method.toUpperCase()}`];
  if (body) {
    parts.push(`-H 'Content-Type: application/json'`);
    parts.push(`-d '${body.replace(/'/g, "'\\''")}'`);
  }
  if (url) {
    parts.push(`'${url}'`);
  }
  output.textContent = parts.join(' ');
};

const initUtilities = () => {
  document.getElementById('encode')?.addEventListener('click', () => handleCodec('encode'));
  document.getElementById('decode')?.addEventListener('click', () => handleCodec('decode'));
  document.getElementById('regex-pattern')?.addEventListener('input', testRegex);
  document.getElementById('regex-test')?.addEventListener('input', testRegex);
  document.getElementById('convert-time')?.addEventListener('click', convertTimestamp);
  document.getElementById('generate-uuid')?.addEventListener('click', generateUuid);
  document.getElementById('generate-password')?.addEventListener('click', generatePassword);
  ['http-method', 'http-url', 'http-body'].forEach((id) =>
    document.getElementById(id)?.addEventListener('input', updateHttpBuilder)
  );
  updateHttpBuilder();
};

document.addEventListener('DOMContentLoaded', initUtilities);
