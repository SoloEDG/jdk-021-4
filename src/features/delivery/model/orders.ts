import type { Game, RecipeId } from "../../../shared/types";
import { recipes } from "../../../shared/catalog";
import { KITCHEN, nodeName, shortestTime } from "../lib/map";
import { disposeParcel, removeStopsFor } from "./parcels";

const DEST_NODES = [2, 5, 3, 6, 4, 1];
const CUSTOMERS = ["小周", "阿May", "陈先生", "白小姐", "小赵", "花店老板娘"];

function pushFee(g: Game, label: string, amount: number) {
  g.entries.push({
    id: g.nextId++,
    time: g.time,
    label,
    amount,
    kind: "fee",
  });
}

export function activeDeliveries(g: Game) {
  return g.deliveryOrders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  );
}

export function acceptDelivery(g: Game, id: number) {
  const o = g.deliveryOrders.find((o) => o.id === id);
  if (o?.status !== "incoming") return;
  o.status = "accepted";
  g.notice = `已接外卖 #${o.id}，请在 ${Math.ceil(o.pickupBy - g.time)}s 内打包出餐`;
}

export function arriveDelivery(g: Game) {
  if (activeDeliveries(g).length >= 5) return;
  const seq = Math.floor(g.time / 25);
  const list: RecipeId[] = ["steak", "pasta", "salad"];
  const recipe = list[seq % 3];
  const node = DEST_NODES[seq % DEST_NODES.length];
  g.deliveryOrders.push({
    id: g.nextId++,
    recipe,
    customer: CUSTOMERS[seq % CUSTOMERS.length],
    node,
    price: Math.round(recipes[recipe].price * 1.25),
    arrived: g.time,
    acceptBy: g.time + 15,
    pickupBy: g.time + 45,
    deliverBy: g.time + 70 + shortestTime(KITCHEN, node, []),
    status: "incoming",
    parcelId: null,
    riderId: null,
  });
  g.notice = `新的外卖订单：${recipes[recipe].name} → ${nodeName(node)}`;
}

export function expireDelivery(g: Game) {
  for (const o of g.deliveryOrders) {
    if (o.status === "delivered" || o.status === "cancelled") continue;
    if (o.status === "incoming" && g.time > o.acceptBy) {
      o.status = "cancelled";
      pushFee(g, `外卖#${o.id} 未及时接单`, -2);
      g.notice = `外卖 #${o.id} 超时未接单，已流失`;
      continue;
    }
    if (
      (o.status === "accepted" ||
        o.status === "packed" ||
        o.status === "assigned") &&
      g.time > o.pickupBy
    ) {
      o.status = "cancelled";
      pushFee(g, `外卖#${o.id} 取餐超时`, -5);
      disposeParcel(g, o, `外卖#${o.id} 包裹报废`);
      removeStopsFor(g, o.id);
      g.notice = `外卖 #${o.id} 取餐超时，订单取消`;
      continue;
    }
    if (o.status === "picked" && g.time > o.deliverBy) {
      o.status = "cancelled";
      pushFee(g, `外卖#${o.id} 送达超时`, -8);
      disposeParcel(g, o, `外卖#${o.id} 途中报废`);
      removeStopsFor(g, o.id);
      g.notice = `外卖 #${o.id} 送达超时，客户拒收`;
    }
  }
}

export function cancelDelivery(g: Game, id: number) {
  const o = g.deliveryOrders.find((o) => o.id === id);
  if (!o) return;
  if (o.status === "delivered" || o.status === "cancelled") {
    g.notice = "订单已完结，无法取消";
    return;
  }
  const rejecting = o.status === "incoming";
  o.status = "cancelled";
  pushFee(
    g,
    `${rejecting ? "拒接" : "取消"}外卖#${o.id} 违约金`,
    rejecting ? -2 : -5,
  );
  disposeParcel(g, o, `外卖#${o.id} 包裹报废`);
  removeStopsFor(g, o.id);
  g.notice = `外卖 #${o.id} 已取消，包裹不会回到出餐台`;
}

export function settleDeliveries(g: Game) {
  for (const o of g.deliveryOrders) {
    if (o.status === "delivered" || o.status === "cancelled") continue;
    o.status = "cancelled";
    pushFee(g, `打烊取消外卖#${o.id}`, -5);
    disposeParcel(g, o, `外卖#${o.id} 包裹报废`);
  }
  for (const r of g.riders) {
    r.stops = [];
    r.parcels = [];
    r.leg = null;
    r.hold = false;
    r.departAt = null;
  }
  g.closureAlert = null;
}
