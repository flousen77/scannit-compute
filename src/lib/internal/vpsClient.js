const VALID_WINDOWS = new Set(['24h', '7d', '30d']);

function getConfig() {
  const baseUrl = process.env.VPS_BASE_URL;
  const apiKey = process.env.VPS_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error('VPS_BASE_URL / VPS_API_KEY are not set');
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

async function vpsFetch(path) {
  const { baseUrl, apiKey } = getConfig();
  const url = `${baseUrl}${path}`;

  let res;
  try {
    res = await fetch(url, {
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store',
    });
  } catch (error) {
    console.error(`VPS request failed: ${url}`, error.cause || error);
    throw error;
  }

  if (!res.ok) {
    throw new Error(`VPS request failed: ${path} (${res.status})`);
  }

  return res.json();
}

function assertWindow(window) {
  if (!VALID_WINDOWS.has(window)) {
    throw new Error(`Invalid window: ${window}`);
  }
}

export function getUids() {
  return vpsFetch('/api/uids');
}

export function getEarnings(uid, window) {
  assertWindow(window);
  return vpsFetch(`/api/uids/${encodeURIComponent(uid)}/earnings?window=${window}`);
}

export function getNodes(uid, window) {
  assertWindow(window);
  return vpsFetch(`/api/uids/${encodeURIComponent(uid)}/nodes?window=${window}`);
}
