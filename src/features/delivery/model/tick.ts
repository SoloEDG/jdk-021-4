import type { Game } from "../../../shared/types";
import { arriveDelivery, expireDelivery } from "./orders";
import { tickClosures, tickFleet } from "./fleet";

export function tickDelivery(g: Game) {
  tickClosures(g);
  tickFleet(g);
  expireDelivery(g);
  if (g.time >= g.nextDeliveryAt && g.time < 150) {
    arriveDelivery(g);
    g.nextDeliveryAt = g.time + 25;
  }
}
