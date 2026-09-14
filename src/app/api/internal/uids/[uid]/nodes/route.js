import { isAuthorized } from '@/lib/internal/auth';
import { getNodes } from '@/lib/internal/vpsClient';

export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { uid } = await params;
  const netuid = Number(request.nextUrl.searchParams.get('netuid'));
  if (!Number.isInteger(netuid)) {
    // Required, never defaulted: uid 162 exists on both SN4 and SN51, so a
    // missing netuid would silently serve one cluster's data as the other's.
    return Response.json({ error: 'netuid query param is required' }, { status: 400 });
  }

  const since = request.nextUrl.searchParams.get('since');
  const until = request.nextUrl.searchParams.get('until');
  const window = request.nextUrl.searchParams.get('window');
  const range = since ? { since, until: until || undefined } : { window: window || '24h' };

  try {
    const nodes = await getNodes(netuid, uid);
    return Response.json(nodes);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
