import { isAuthorized } from '@/lib/internal/auth';
import { getNodeOptions } from '@/lib/internal/vpsClient';

// Populates the cluster form's node picker. Options come from whatever the
// provider last reported, so a machine added or removed on Lium shows up
// here without anyone editing a config — and nobody ever types a uuid.
export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { netuid, uid } = await params;

  try {
    const nodes = await getNodeOptions(Number(netuid), uid);
    return Response.json({ netuid: Number(netuid), uid: Number(uid), nodes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
