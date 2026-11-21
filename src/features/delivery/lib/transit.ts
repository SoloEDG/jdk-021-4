import type { Game, Parcel, Rider, Stop } from "../../../shared/types";
import { shortestPath } from "./map";

export function parcelQuality(g: Game, p: Parcel, at = g.time) {
  const grace = p.insulated ? 12 : 6;
  const rate = p.insulated ? 0.8 : 2.2;
  return Math.max(
    0,
    Math.round(p.qualityAtPack - Math.max(0, at - p.packedAt - grace) * rate),
  );
}

export type Strategy = "deadline" | "value";

export function sequenced(g: Game, stops: Stop[], strategy: Strategy) {
  const key = (s: Stop) => {
    const o = g.deliveryOrders.find((o) => o.id === s.orderId);
    if (!o) return 0;
    if (strategy === "value") return -o.price;
    return s.kind === "pickup" ? o.pickupBy : o.deliverBy;
  };
  const sorted = [...stops].sort((a, b) => {
    const d = key(a) - key(b);
    if (d) return d;
    if (a.kind === b.kind) return 0;
    return a.kind === "pickup" ? -1 : 1;
  });
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].kind !== "dropoff") continue;
    const j = sorted.findIndex(
      (x) => x.kind === "pickup" && x.orderId === sorted[i].orderId,
    );
    if (j > i) {
      const [pick] = sorted.splice(j, 1);
      sorted.splice(i, 0, pick);
    }
  }
  return sorted;
}

export function simulate(g: Game, r: Rider, stops: Stop[]) {
  let t = g.time;
  let pos = r.at;
  if (r.leg) {
    t += Math.max(0, r.leg.arrive - g.time);
    pos = r.leg.to;
  }
  const path = [pos];
  const doomed = new Set<number>();
  let loss = 0;
  for (const s of stops) {
    const seg = shortestPath(pos, s.node, g.closedEdges);
    t += seg.time;
    pos = s.node;
    path.push(...seg.path.slice(1));
    const o = g.deliveryOrders.find((o) => o.id === s.orderId);
    if (!o || doomed.has(o.id)) continue;
    if (s.kind === "pickup") {
      if (t > o.pickupBy) {
        loss += 8;
        doomed.add(o.id);
      }
      continue;
    }
    const p = g.parcels.find((p) => p.id === o.parcelId);
    const q = p ? parcelQuality(g, p, t) : 0;
    const full = o.price + 5;
    loss +=
      t <= o.deliverBy && q >= 30
        ? full - (Math.round((o.price * q) / 100) + 5)
        : full + 3;
  }
  return { loss: Math.round(loss), eta: t, path };
}
