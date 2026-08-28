import { isAuthorized } from '@/lib/internal/auth';
import { getEarnings } from '@/lib/internal/vpsClient';

export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { uid } = await params;
  const since = request.nextUrl.searchParams.get('since');
  const window = request.nextUrl.searchParams.get('window');
  const range = since ? { since } : { window: window || '24h' };

  try {
    const earnings = await getEarnings(uid, range);
    return Response.json(earnings);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
