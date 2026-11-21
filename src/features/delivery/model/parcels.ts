import type { Game, DeliveryOrder, Parcel } from "../../../shared/types";
import { recipes } from "../../../shared/catalog";
import { servingQuality } from "../../service/lib/freshness";

export function packDish(g: Game, orderId: number, insulated: boolean) {
  const o = g.deliveryOrders.find((o) => o.id === orderId);
  if (!o || o.status !== "accepted") return;
  const d = g.dishes.find((d) => d.id === g.selectedDish);
  if (!d || d.stage !== "plated") {
    g.notice = "请先在出餐台选择一份已装盘菜品";
    return;
  }
  if (d.recipe !== o.recipe) {
    g.notice = "菜品与外卖订单不符，无法打包";
    return;
  }
  const q = servingQuality(g, d);
  const parcel: Parcel = {
    id: g.nextId++,
    orderId: o.id,
    dishId: d.id,
    recipe: d.recipe,
    packedAt: g.time,
    qualityAtPack: q,
    insulated,
    holder: "kitchen",
  };
  g.parcels.push(parcel);
  g.dishes = g.dishes.filter((x) => x.id !== d.id);
  g.selectedDish = null;
  o.status = "packed";
  o.parcelId = parcel.id;
  if (insulated) {
    g.entries.push({
      id: g.nextId++,
      time: g.time,
      label: `保温包装 外卖#${o.id}`,
      amount: -2,
      kind: "supply",
    });
  }
  g.notice = `外卖 #${o.id} 已${insulated ? "保温" : ""}打包（品质 ${q}），这份菜不能再上给堂食`;
}

export function disposeParcel(g: Game, o: DeliveryOrder, label: string) {
  const p = g.parcels.find((p) => p.id === o.parcelId);
  if (!p || p.holder === "customer" || p.holder === "trash") return;
  if (typeof p.holder === "number") {
    const r = g.riders.find((r) => r.id === p.holder);
    if (r) r.parcels = r.parcels.filter((id) => id !== p.id);
  }
  p.holder = "trash";
  g.entries.push({
    id: g.nextId++,
    time: g.time,
    label,
    amount: -3,
    kind: "waste",
  });
}

export function removeStopsFor(g: Game, orderId: number) {
  for (const r of g.riders) {
    r.stops = r.stops.filter((s) => s.orderId !== orderId);
  }
}
