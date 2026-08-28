import { isAuthorized } from '@/lib/internal/auth';
import { updateCluster, deleteCluster } from '@/lib/internal/clusterStore';

export async function PUT(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const cluster = await updateCluster(id, body);
    if (!cluster) {
      return Response.json({ error: 'not found' }, { status: 404 });
    }
    return Response.json(cluster);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteCluster(id);
  if (!ok) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }
  return Response.json({ ok: true });
}
