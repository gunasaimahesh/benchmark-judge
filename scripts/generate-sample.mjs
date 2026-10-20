import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const COUNT_TABLE = [
  ['safe', 'safe', 'safe', 93],
  ['safe', 'safe', 'spam', 6],
  ['safe', 'safe', 'phishing', 7],
  ['safe', 'safe', 'malware', 2],
  ['safe', 'spam', 'safe', 1],
  ['safe', 'spam', 'spam', 1],
  ['spam', 'spam', 'spam', 45],
  ['spam', 'spam', 'safe', 5],
  ['spam', 'spam', 'phishing', 3],
  ['spam', 'safe', 'spam', 1],
  ['spam', 'safe', 'safe', 1],
  ['phishing', 'phishing', 'phishing', 9],
  ['phishing', 'safe', 'phishing', 8],
  ['phishing', 'spam', 'phishing', 3],
  ['phishing', 'phishing', 'spam', 1],
  ['phishing', 'safe', 'spam', 2],
  ['phishing', 'safe', 'safe', 2],
  ['malware', 'malware', 'malware', 2],
  ['malware', 'safe', 'malware', 4],
  ['malware', 'spam', 'malware', 1],
  ['malware', 'phishing', 'malware', 1],
  ['malware', 'safe', 'phishing', 1],
  ['malware', 'safe', 'safe', 1],
];

const TEMPLATES = {
  safe: [
    'Notes from design review #{n}',
    'Re: Q3 budget draft (rev {n})',
    'Your order #{n} has shipped',
    'Agenda for sprint planning, room {n}',
    'Invoice {n} paid, thank you',
    'Weekend photos, album {n}',
    'Team lunch on Friday? (poll {n})',
    'Library reminder: book ref {n} is due',
  ],
  spam: [
    "You've won a gift card! Claim code {n}",
    'Work from home and earn big, offer {n}',
    'Exclusive deal on designer watches, promo {n}',
    'Miracle weight-loss formula {n}, order now',
    'Last chance: free cruise, ticket {n}',
    'Cheap meds shipped free, order #{n}',
  ],
  phishing: [
    'Your mailbox is full: verify your account (case {n})',
    'Unusual sign-in attempt #{n}: confirm your password',
    'Payroll update required: confirm bank details, ref {n}',
    'Package #{n} on hold: pay the customs fee',
    'IT Helpdesk: password expires today, ticket {n}',
    'Your account will be closed, case {n}',
  ],
  malware: [
    'Scanned document {n} (see attached .zip)',
    'Invoice_{n}.xlsm: enable macros to view',
    'Voice message {n}.wav.exe',
    'Updated contract_{n}.pdf.exe',
    'Shipping label {n}: open the attached file',
  ],
};

export function mulberry32(seed) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function generateSampleRows() {
  const rows = [];
  for (const [trueLabel, modelA, modelB, count] of COUNT_TABLE) {
    const workCount = Math.round(count * 0.6);
    for (let index = 0; index < count; index += 1) {
      rows.push({
        category: index < workCount ? 'work' : 'personal',
        true_label: trueLabel,
        model_a: modelA,
        model_b: modelB,
      });
    }
  }

  const random = mulberry32(20261020);
  for (let index = rows.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [rows[index], rows[swapIndex]] = [rows[swapIndex], rows[index]];
  }

  const labelIndexes = new Map();
  return rows.map((row, index) => {
    const rowNumber = index + 1;
    const labelIndex = labelIndexes.get(row.true_label) ?? 0;
    labelIndexes.set(row.true_label, labelIndex + 1);
    const template = TEMPLATES[row.true_label][labelIndex % TEMPLATES[row.true_label].length];
    const subjectNumber = 100 + ((rowNumber * 37) % 900);
    return {
      id: `email-${String(rowNumber).padStart(3, '0')}`,
      category: row.category,
      true_label: row.true_label,
      model_a: row.model_a,
      model_b: row.model_b,
      text: template.replace('{n}', String(subjectNumber)),
    };
  });
}

export function generateSampleCsv() {
  const header = ['id', 'category', 'true_label', 'model_a', 'model_b', 'text'];
  const lines = [header.join(',')];
  for (const row of generateSampleRows()) {
    lines.push(header.map((column) => csvEscape(row[column])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

const thisFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedFile === thisFile) {
  const outputPath = path.resolve(path.dirname(thisFile), '../src/fixtures/sample.csv');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generateSampleCsv(), 'utf8');
}
