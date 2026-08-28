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

// `range` is either { window: '24h' | '7d' | '30d' } or { since: '<ISO date>' }.
function buildRangeQuery(range) {
  const params = new URLSearchParams();
  if (range?.since) {
    params.set('since', range.since);
  } else {
    params.set('window', range?.window || '24h');
  }
  return params.toString();
}

export function getUids() {
  return vpsFetch('/api/uids');
}

export function getEarnings(uid, range) {
  return vpsFetch(`/api/uids/${encodeURIComponent(uid)}/earnings?${buildRangeQuery(range)}`);
}

export function getNodes(uid, range) {
  return vpsFetch(`/api/uids/${encodeURIComponent(uid)}/nodes?${buildRangeQuery(range)}`);
}
