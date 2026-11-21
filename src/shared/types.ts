export type RecipeId = "steak" | "pasta" | "salad";
export type Ingredient = "beef" | "noodle" | "greens";
export interface Recipe {
  id: RecipeId;
  name: string;
  icon: string;
  ingredient: Ingredient;
  station: "pan" | "pot";
  target: number;
  price: number;
}
export interface Order {
  id: number;
  recipe: RecipeId;
  guest: string;
  arrived: number;
  deadline: number;
  status: "waiting" | "accepted" | "served" | "left";
}
export interface Portion {
  id: number;
  recipe: RecipeId;
  preparedAt: number;
}
export interface Stove {
  id: number;
  kind: "pan" | "pot";
  portion: Portion | null;
  started: number;
}
export interface Dish {
  id: number;
  recipe: RecipeId;
  quality: number;
  cookedAt: number;
  stage: "counter" | "plated";
}
export interface Entry {
  id: number;
  time: number;
  label: string;
  amount: number;
  kind: "sale" | "waste" | "miss" | "supply" | "fee";
}
export type DeliveryStatus =
  | "incoming"
  | "accepted"
  | "packed"
  | "assigned"
  | "picked"
  | "delivered"
  | "cancelled";
export interface DeliveryOrder {
  id: number;
  recipe: RecipeId;
  customer: string;
  node: number;
  price: number;
  arrived: number;
  acceptBy: number;
  pickupBy: number;
  deliverBy: number;
  status: DeliveryStatus;
  parcelId: number | null;
  riderId: number | null;
}
export type ParcelHolder = "kitchen" | "customer" | "trash" | number;
export interface Parcel {
  id: number;
  orderId: number;
  dishId: number;
  recipe: RecipeId;
  packedAt: number;
  qualityAtPack: number;
  insulated: boolean;
  holder: ParcelHolder;
}
export interface Stop {
  node: number;
  kind: "pickup" | "dropoff";
  orderId: number;
}
export interface Leg {
  from: number;
  to: number;
  depart: number;
  arrive: number;
}
export interface Rider {
  id: number;
  name: string;
  capacity: number;
  at: number;
  leg: Leg | null;
  parcels: number[];
  stops: Stop[];
  departAt: number | null;
  hold: boolean;
}
export interface ClosurePlanItem {
  a: number;
  b: number;
  at: number;
  until: number;
  fired: boolean;
  label: string;
}
export interface ClosedEdge {
  a: number;
  b: number;
  until: number;
}
export interface RerouteOption {
  strategy: "deadline" | "value";
  loss: number;
  eta: number;
  path: number[];
}
export interface ClosureAlert {
  a: number;
  b: number;
  until: number;
  riderId: number;
  options: RerouteOption[];
}
export interface Game {
  time: number;
  duration: number;
  running: boolean;
  ended: boolean;
  nextId: number;
  selectedOrder: number | null;
  selectedDish: number | null;
  orders: Order[];
  stock: Record<Ingredient, number>;
  portions: Portion[];
  stoves: Stove[];
  dishes: Dish[];
  entries: Entry[];
  combo: number;
  served: number;
  missed: number;
  deliveryOrders: DeliveryOrder[];
  parcels: Parcel[];
  riders: Rider[];
  closurePlan: ClosurePlanItem[];
  closedEdges: ClosedEdge[];
  closureAlert: ClosureAlert | null;
  nextDeliveryAt: number;
  delivered: number;
  notice: string;
  best: number;
}
export type Command =
  | { type: "accept"; id: number }
  | { type: "select-order"; id: number }
  | { type: "prepare"; recipe: RecipeId }
  | { type: "cook"; portion: number; stove: number }
  | { type: "lift"; id: number }
  | { type: "plate"; id: number }
  | { type: "select-dish"; id: number }
  | { type: "serve" }
  | { type: "discard"; id: number }
  | { type: "restock"; ingredient: Ingredient }
  | { type: "accept-delivery"; id: number }
  | { type: "pack"; order: number; insulated: boolean }
  | { type: "assign"; order: number; rider: number }
  | { type: "depart"; rider: number }
  | { type: "cancel-delivery"; id: number }
  | { type: "reroute"; strategy: "deadline" | "value" }
  | { type: "dismiss-closure" };
