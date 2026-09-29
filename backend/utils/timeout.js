// Rejects if `promise` hasn't settled within `ms`. The underlying work isn't
// cancelled (use AbortSignal.timeout for fetch), but callers stop waiting.
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

module.exports = { withTimeout };
