import type { Game, Command } from "../shared/types";
import { accept, expire } from "../features/orders";
import { prepare, restock } from "../features/pantry";
import { cook, lift } from "../features/kitchen";
import { plate, discard, deliver } from "../features/service";
import {
  acceptDelivery,
  cancelDelivery,
  packDish,
  assignRider,
  depart,
  applyReroute,
  dismissClosure,
} from "../features/delivery";
const PAUSE_OK: Command["type"][] = [
  "cancel-delivery",
  "reroute",
  "dismiss-closure",
];
export function dispatch(g: Game, c: Command) {
  if (g.ended) {
    g.notice = "今日已打烊，欢迎明天再来";
    return;
  }
  if (!g.running && !PAUSE_OK.includes(c.type)) {
    g.notice = "请先开始营业，暂停时不能操作厨房";
    return;
  }
  switch (c.type) {
    case "accept":
      accept(g, c.id);
      break;
    case "select-order":
      if (g.orders.some((o) => o.id === c.id && o.status === "accepted"))
        g.selectedOrder = c.id;
      break;
    case "prepare":
      prepare(g, c.recipe);
      break;
    case "restock":
      restock(g, c.ingredient);
      break;
    case "cook":
      cook(g, c.portion, c.stove);
      break;
    case "lift":
      lift(g, c.id);
      break;
    case "plate":
      plate(g, c.id);
      break;
    case "select-dish":
      if (g.dishes.some((d) => d.id === c.id && d.stage === "plated"))
        g.selectedDish = c.id;
      break;
    case "serve":
      deliver(g);
      expire(g);
      break;
    case "discard":
      discard(g, c.id);
      break;
    case "accept-delivery":
      acceptDelivery(g, c.id);
      break;
    case "pack":
      packDish(g, c.order, c.insulated);
      break;
    case "assign":
      assignRider(g, c.order, c.rider);
      break;
    case "depart":
      depart(g, c.rider);
      break;
    case "cancel-delivery":
      cancelDelivery(g, c.id);
      break;
    case "reroute":
      applyReroute(g, c.strategy);
      break;
    case "dismiss-closure":
      dismissClosure(g);
      break;
  }
}
