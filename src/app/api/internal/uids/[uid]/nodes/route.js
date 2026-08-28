import { isAuthorized } from '@/lib/internal/auth';
import { getNodes } from '@/lib/internal/vpsClient';

export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { uid } = await params;
  const window = request.nextUrl.searchParams.get('window') || '24h';

  try {
    const nodes = await getNodes(uid, window);
    return Response.json(nodes);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
