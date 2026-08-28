// Shared cost/profit math for cluster cards AND the portfolio totals bar.
// Framework-agnostic (no React) so it can run in both server (page.jsx) and
// client (ClusterCard.jsx) contexts without duplicating formulas — the whole
// point being that "per-GPU earnings", "cost per GPU", and "profit" can't
// silently drift into two different implementations.

export const HOURS_PER_MONTH = 720;

// cost.value means different things per mode: per_hour is a per-GPU rate,
// per_month is the cluster's total monthly bill (so it needs dividing by
// cardCount too, on top of converting month -> hour).
export function getCostPerGpuPerHour(cost, cardCount) {
  if (!cost) return null;
  if (cost.mode === 'per_hour') return cost.value;
  return cardCount ? cost.value / HOURS_PER_MONTH / cardCount : null;
}

export function deriveSubnetEarnings({ earnings, nodes }) {
  const cardCount = nodes?.combined?.avg_cards ?? null;
  const earningsPerGpuPerHour =
    earnings?.hours && cardCount ? earnings.usd_realized / (earnings.hours * cardCount) : null;
  return { cardCount, earningsPerGpuPerHour };
}

export function deriveContractEarnings({ contract }) {
  return {
    cardCount: contract?.cardCount ?? null,
    earningsPerGpuPerHour: contract?.pricePerHourUsd ?? null,
  };
}

// earningsPerMonthProjectedPerGpu / revenuePerMonthProjectedTotal both derive
// from the same rate; "PerGpu" is what individual cards display, "Total"
// (whole-cluster, scaled by cardCount) is what the portfolio bar needs to sum
// meaningfully across clusters of different sizes.
export function computeProfitMetrics({ earningsPerGpuPerHour, cardCount, cost }) {
  const earningsPerMonthProjectedPerGpu =
    earningsPerGpuPerHour != null ? earningsPerGpuPerHour * HOURS_PER_MONTH : null;
  const revenuePerMonthProjectedTotal =
    earningsPerGpuPerHour != null && cardCount
      ? earningsPerGpuPerHour * cardCount * HOURS_PER_MONTH
      : null;

  const costPerGpuPerHour = getCostPerGpuPerHour(cost, cardCount);
  const profitPerGpuPerHour =
    costPerGpuPerHour != null && earningsPerGpuPerHour != null
      ? earningsPerGpuPerHour - costPerGpuPerHour
      : null;
  const marginPercent =
    profitPerGpuPerHour != null && earningsPerGpuPerHour
      ? (profitPerGpuPerHour / earningsPerGpuPerHour) * 100
      : null;
  const profitPerMonthProjected =
    profitPerGpuPerHour != null && cardCount
      ? profitPerGpuPerHour * cardCount * HOURS_PER_MONTH
      : null;

  return {
    earningsPerMonthProjectedPerGpu,
    revenuePerMonthProjectedTotal,
    costPerGpuPerHour,
    profitPerGpuPerHour,
    marginPercent,
    profitPerMonthProjected,
  };
}

// Fleet-wide rollup for the portfolio totals bar. USD only (TAO isn't
// meaningful to sum across mixed subnet/contract clusters). Only clusters
// with cost tracked contribute to the profit figures; the margin denominator
// (revenue) is restricted to that same subset so the percentage stays
// internally consistent.
export function computePortfolioTotals(clustersWithData) {
  let totalClusters = 0;
  let subnetCount = 0;
  let contractCount = 0;
  let clustersWithCost = 0;
  let totalProfitPerMonth = 0;
  let subnetProfitPerMonth = 0;
  let contractProfitPerMonth = 0;
  let totalRevenuePerMonth = 0;

  for (const { cluster, earnings, nodes } of clustersWithData) {
    totalClusters += 1;
    const isSubnet = cluster.hostingMode === 'subnet';
    if (isSubnet) subnetCount += 1;
    else contractCount += 1;

    if (!cluster.cost) continue;

    const { cardCount, earningsPerGpuPerHour } = isSubnet
      ? deriveSubnetEarnings({ earnings, nodes })
      : deriveContractEarnings({ contract: cluster.contract });

    const { profitPerMonthProjected, revenuePerMonthProjectedTotal } = computeProfitMetrics({
      earningsPerGpuPerHour,
      cardCount,
      cost: cluster.cost,
    });

    if (profitPerMonthProjected == null || revenuePerMonthProjectedTotal == null) continue;

    clustersWithCost += 1;
    totalProfitPerMonth += profitPerMonthProjected;
    totalRevenuePerMonth += revenuePerMonthProjectedTotal;
    if (isSubnet) subnetProfitPerMonth += profitPerMonthProjected;
    else contractProfitPerMonth += profitPerMonthProjected;
  }

  const hasCostData = clustersWithCost > 0;

  return {
    totalClusters,
    subnetCount,
    contractCount,
    clustersWithCost,
    totalProfitPerMonth: hasCostData ? totalProfitPerMonth : null,
    subnetProfitPerMonth: hasCostData ? subnetProfitPerMonth : null,
    contractProfitPerMonth: hasCostData ? contractProfitPerMonth : null,
    blendedMarginPercent:
      hasCostData && totalRevenuePerMonth
        ? (totalProfitPerMonth / totalRevenuePerMonth) * 100
        : null,
  };
}
