import type { Game, Rider } from "../../../shared/types";
import { recipes } from "../../../shared/catalog";
import { KITCHEN, edgeTime, nodeName, shortestPath, shortestTime } from "../lib/map";
import { parcelQuality, sequenced, simulate, type Strategy } from "../lib/transit";

export function assignRider(g: Game, orderId: number, riderId: number) {
  const o = g.deliveryOrders.find((o) => o.id === orderId);
  if (!o || o.status !== "packed") return;
  const p = g.parcels.find((p) => p.id === o.parcelId);
  if (!p || p.holder !== "kitchen") {
    g.notice = "包裹已不在厨房，不能重复指派";
    return;
  }
  const r = g.riders.find((r) => r.id === riderId);
  if (!r) return;
  const load =
    r.parcels.length + r.stops.filter((s) => s.kind === "pickup").length;
  if (load >= r.capacity) {
    g.notice = `${r.name} 已满载（${r.capacity} 件）`;
    return;
  }
  o.status = "assigned";
  o.riderId = r.id;
  r.stops.push(
    { node: KITCHEN, kind: "pickup", orderId: o.id },
    { node: o.node, kind: "dropoff", orderId: o.id },
  );
  r.stops = sequenced(g, r.stops, "deadline");
  const enroute = r.leg !== null || r.at !== KITCHEN;
  if (!enroute && r.departAt === null) r.departAt = g.time + 6;
  g.notice = enroute
    ? `已途中追加给 ${r.name}，骑手将回店取餐`
    : `已合单给 ${r.name}，6 秒内可继续加单`;
}

export function depart(g: Game, riderId: number) {
  const r = g.riders.find((r) => r.id === riderId);
  if (!r || r.at !== KITCHEN || r.leg || !r.stops.length) return;
  r.departAt = g.time;
  g.notice = `${r.name} 立即发车`;
}

function processNode(g: Game, r: Rider) {
  for (const s of r.stops.filter(
    (s) => s.node === r.at && s.kind === "pickup",
  )) {
    const o = g.deliveryOrders.find((o) => o.id === s.orderId);
    const p = o ? g.parcels.find((p) => p.id === o.parcelId) : null;
    if (!o || o.status !== "assigned" || !p || p.holder !== "kitchen") {
      r.stops = r.stops.filter((x) => x !== s);
      continue;
    }
    if (r.parcels.length >= r.capacity) continue;
    p.holder = r.id;
    r.parcels.push(p.id);
    o.status = "picked";
    o.riderId = r.id;
    r.stops = r.stops.filter((x) => x !== s);
    g.notice = `${r.name} 已取外卖 #${o.id}，送往${nodeName(o.node)}`;
  }
  for (const s of r.stops.filter(
    (s) => s.node === r.at && s.kind === "dropoff",
  )) {
    const o = g.deliveryOrders.find((o) => o.id === s.orderId);
    if (!o || o.status !== "picked") {
      r.stops = r.stops.filter((x) => x !== s);
      continue;
    }
    const p = g.parcels.find((p) => p.id === o.parcelId);
    const q = p ? parcelQuality(g, p) : 0;
    if (q >= 30) {
      const amount = Math.round((o.price * q) / 100) + 5;
      o.status = "delivered";
      if (p) p.holder = "customer";
      g.delivered++;
      g.entries.push({
        id: g.nextId++,
        time: g.time,
        label: `外卖#${o.id} · ${o.customer} · ${recipes[o.recipe].name}`,
        amount,
        kind: "sale",
      });
      g.notice = `外卖 #${o.id} 送达，品质 ${q}，+¥${amount}`;
    } else {
      o.status = "cancelled";
      if (p) p.holder = "trash";
      g.entries.push({
        id: g.nextId++,
        time: g.time,
        label: `外卖#${o.id} 品质不足被拒收`,
        amount: -3,
        kind: "waste",
      });
      g.notice = `外卖 #${o.id} 品质 ${q} 被拒收，包裹报废`;
    }
    if (p) r.parcels = r.parcels.filter((id) => id !== p.id);
    r.stops = r.stops.filter((x) => x !== s);
  }
}

export function tickFleet(g: Game) {
  for (const r of g.riders) {
    if (r.leg && g.time >= r.leg.arrive) {
      r.at = r.leg.to;
      r.leg = null;
      processNode(g, r);
    }
    if (!r.stops.length) {
      r.departAt = null;
      continue;
    }
    if (r.leg || r.hold) continue;
    if (r.at === KITCHEN && r.departAt !== null && g.time < r.departAt)
      continue;
    r.departAt = null;
    const stop = r.stops[0];
    if (stop.node === r.at) {
      processNode(g, r);
      continue;
    }
    const seg = shortestPath(r.at, stop.node, g.closedEdges);
    if (seg.path.length < 2) continue;
    r.leg = {
      from: seg.path[0],
      to: seg.path[1],
      depart: g.time,
      arrive: g.time + edgeTime(seg.path[0], seg.path[1]),
    };
  }
}

function maybeAlert(g: Game, a: number, b: number, until: number) {
  if (g.closureAlert) return;
  for (const r of g.riders) {
    if (r.stops.length < 2) continue;
    const pos = r.leg ? r.leg.to : r.at;
    const affected = r.stops.some(
      (s) =>
        shortestTime(pos, s.node, []) !==
        shortestTime(pos, s.node, g.closedEdges),
    );
    if (!affected) continue;
    const options = (["deadline", "value"] as const).map((strategy) => ({
      strategy,
      ...simulate(g, r, sequenced(g, r.stops, strategy)),
    }));
    g.closureAlert = { a, b, until, riderId: r.id, options };
    r.hold = true;
    return;
  }
}

export function tickClosures(g: Game) {
  for (const c of g.closurePlan) {
    if (c.fired || g.time < c.at) continue;
    c.fired = true;
    g.closedEdges.push({ a: c.a, b: c.b, until: c.until });
    g.notice = `⛔ ${c.label}，约 ${Math.round(c.until - g.time)}s 后恢复`;
    maybeAlert(g, c.a, c.b, c.until);
  }
  for (let i = g.closedEdges.length - 1; i >= 0; i--) {
    if (g.time >= g.closedEdges[i].until) {
      g.closedEdges.splice(i, 1);
      g.notice = "道路已恢复通行";
    }
  }
}

export function applyReroute(g: Game, strategy: Strategy) {
  const alert = g.closureAlert;
  if (!alert) return;
  const r = g.riders.find((r) => r.id === alert.riderId);
  if (r) {
    r.stops = sequenced(g, r.stops, strategy);
    r.hold = false;
    g.notice =
      strategy === "value"
        ? `${r.name} 调整路线：先保高价单`
        : `${r.name} 调整路线：先送临期单`;
  }
  g.closureAlert = null;
}

export function dismissClosure(g: Game) {
  const alert = g.closureAlert;
  if (alert) {
    const r = g.riders.find((r) => r.id === alert.riderId);
    if (r) r.hold = false;
  }
  g.closureAlert = null;
  g.notice = "维持当前配送顺序";
}
