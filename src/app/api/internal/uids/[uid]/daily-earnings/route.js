import { isAuthorized } from '@/lib/internal/auth';
import { getDailyEarnings } from '@/lib/internal/vpsClient';

export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { uid } = await params;
  const days = Number(request.nextUrl.searchParams.get('days')) || 30;

  try {
    const dailyEarnings = await getDailyEarnings(uid, days);
    return Response.json(dailyEarnings);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
