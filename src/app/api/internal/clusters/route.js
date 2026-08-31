import { isAuthorized } from '@/lib/internal/auth';
import { listClusters, createCluster } from '@/lib/internal/clusterStore';

export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  return Response.json(await listClusters());
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  try {
    const cluster = await createCluster(body);
    return Response.json(cluster, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
