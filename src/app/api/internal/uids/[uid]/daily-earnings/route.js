import { isAuthorized } from '@/lib/internal/auth';
import { getDailyEarnings } from '@/lib/internal/vpsClient';

export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { uid } = await params;
  const nodeKey = request.nextUrl.searchParams.get('nodeKey') || null;
  const netuid = Number(request.nextUrl.searchParams.get('netuid'));
  if (!Number.isInteger(netuid)) {
    // Required, never defaulted: uid 162 exists on both SN4 and SN51, so a
    // missing netuid would silently serve one cluster's data as the other's.
    return Response.json({ error: 'netuid query param is required' }, { status: 400 });
  }

  const days = Number(request.nextUrl.searchParams.get('days')) || 30;

  try {
    const dailyEarnings = await getDailyEarnings(netuid, uid, days, nodeKey);
    return Response.json(dailyEarnings);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
