import { isAuthorized } from '@/lib/internal/auth';
import { getUids } from '@/lib/internal/vpsClient';

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const uids = await getUids();
    return Response.json(uids);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
