import { getPublicMarketRates } from '@/lib/marketRates';

export async function GET() {
  try {
    return Response.json(await getPublicMarketRates());
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
