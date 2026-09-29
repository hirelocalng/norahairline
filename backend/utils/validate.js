// Input cleaning shared by the order and admin routes.

// Control characters (except tab/newline), zero-width and bidi-override
// characters — the ones used to hide or reorder text in messages.
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁤﻿]/g;

// Single-line text: strips invisible characters, folds newlines/tabs into
// spaces, collapses runs of whitespace and caps the length.
function cleanLine(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .replace(INVISIBLE, '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// Multi-line text (descriptions): keeps single newlines, drops the rest.
function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value
    .replace(INVISIBLE, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Nigerian or international numbers: digits with optional +, spaces, dashes, brackets.
const PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,18}$/;

function isEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value);
}

function isPhone(value) {
  return typeof value === 'string' && PHONE_RE.test(value) && value.replace(/\D/g, '').length >= 7;
}

function toPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= 2147483647 ? n : null;
}

// Money: positive, at most 2 decimal places, below a sane ceiling (₦100m).
function toPrice(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n >= 100_000_000) return null;
  return Math.round(n * 100) / 100;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { cleanLine, cleanText, isEmail, isPhone, toPositiveInt, toPrice, escapeHtml };
