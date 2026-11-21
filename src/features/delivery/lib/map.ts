import type { ClosedEdge } from "../../../shared/types";

export interface MapNode {
  id: number;
  name: string;
  x: number;
  y: number;
}
export interface MapEdge {
  a: number;
  b: number;
  time: number;
}

export const KITCHEN = 0;

export const nodes: MapNode[] = [
  { id: 0, name: "餐厅", x: 50, y: 86 },
  { id: 1, name: "梧桐里", x: 18, y: 62 },
  { id: 2, name: "河滨路", x: 82, y: 62 },
  { id: 3, name: "老城口", x: 32, y: 36 },
  { id: 4, name: "书院巷", x: 68, y: 36 },
  { id: 5, name: "市集广场", x: 16, y: 12 },
  { id: 6, name: "车站前", x: 84, y: 12 },
];

export const edges: MapEdge[] = [
  { a: 0, b: 1, time: 8 },
  { a: 0, b: 2, time: 8 },
  { a: 1, b: 3, time: 7 },
  { a: 2, b: 4, time: 7 },
  { a: 3, b: 4, time: 9 },
  { a: 3, b: 5, time: 7 },
  { a: 4, b: 6, time: 7 },
  { a: 5, b: 6, time: 10 },
];

export function nodeName(id: number) {
  return nodes.find((n) => n.id === id)?.name ?? `街区${id}`;
}

export function isClosed(closed: ClosedEdge[], a: number, b: number) {
  return closed.some(
    (e) => (e.a === a && e.b === b) || (e.a === b && e.b === a),
  );
}

export function edgeTime(a: number, b: number) {
  const e = edges.find(
    (e) => (e.a === a && e.b === b) || (e.a === b && e.b === a),
  );
  return e ? e.time : Infinity;
}

export function shortestPath(
  from: number,
  to: number,
  closed: ClosedEdge[],
): { path: number[]; time: number } {
  if (from === to) return { path: [from], time: 0 };
  const dist = new Array<number>(nodes.length).fill(Infinity);
  const prev = new Array<number>(nodes.length).fill(-1);
  const done = new Array<boolean>(nodes.length).fill(false);
  dist[from] = 0;
  for (;;) {
    let u = -1,
      best = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      if (!done[i] && dist[i] < best) {
        best = dist[i];
        u = i;
      }
    }
    if (u === -1 || u === to) break;
    done[u] = true;
    for (const e of edges) {
      if (isClosed(closed, e.a, e.b)) continue;
      let v = -1;
      if (e.a === u) v = e.b;
      else if (e.b === u) v = e.a;
      else continue;
      if (dist[u] + e.time < dist[v]) {
        dist[v] = dist[u] + e.time;
        prev[v] = u;
      }
    }
  }
  if (!Number.isFinite(dist[to])) return { path: [from], time: Infinity };
  const path = [to];
  while (path[0] !== from) path.unshift(prev[path[0]]);
  return { path, time: dist[to] };
}

export function shortestTime(from: number, to: number, closed: ClosedEdge[]) {
  return shortestPath(from, to, closed).time;
}
