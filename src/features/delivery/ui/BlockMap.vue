<script setup lang="ts">
import type { Game, Rider } from "../../../shared/types";
import { nodes, edges, isClosed } from "../lib/map";

defineProps<{ game: Game }>();

function nodeById(id: number) {
  return nodes.find((n) => n.id === id)!;
}
function riderXY(game: Game, r: Rider) {
  if (r.leg) {
    const a = nodeById(r.leg.from),
      b = nodeById(r.leg.to);
    const t = Math.min(
      1,
      Math.max(
        0,
        (game.time - r.leg.depart) / Math.max(0.001, r.leg.arrive - r.leg.depart),
      ),
    );
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  const n = nodeById(r.at);
  return { x: n.x, y: n.y };
}
function closedUntil(game: Game, a: number, b: number) {
  const c = game.closedEdges.find(
    (e) => (e.a === a && e.b === b) || (e.a === b && e.b === a),
  );
  return c ? Math.max(0, Math.ceil(c.until - game.time)) : 0;
}
function dropoffs(game: Game) {
  return game.deliveryOrders.filter((o) => o.status === "picked");
}
</script>
<template>
  <div class="map-box">
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      <g v-for="e in edges" :key="e.a + '-' + e.b">
        <line
          :x1="nodeById(e.a).x"
          :y1="nodeById(e.a).y"
          :x2="nodeById(e.b).x"
          :y2="nodeById(e.b).y"
          class="road"
          :class="{ closed: isClosed(game.closedEdges, e.a, e.b) }"
        />
        <text
          v-if="isClosed(game.closedEdges, e.a, e.b)"
          :x="(nodeById(e.a).x + nodeById(e.b).x) / 2"
          :y="(nodeById(e.a).y + nodeById(e.b).y) / 2 - 2"
          class="closed-tag"
        >
          ⛔{{ closedUntil(game, e.a, e.b) }}s
        </text>
      </g>
      <g v-for="n in nodes" :key="n.id">
        <circle
          :cx="n.x"
          :cy="n.y"
          :r="n.id === 0 ? 3.6 : 2.4"
          class="node"
          :class="{ kitchen: n.id === 0 }"
        />
        <text :x="n.x" :y="n.y - 4.5" class="node-name">
          {{ n.id === 0 ? "🍳餐厅" : n.name }}
        </text>
      </g>
      <text
        v-for="o in dropoffs(game)"
        :key="o.id"
        :x="nodeById(o.node).x + 3"
        :y="nodeById(o.node).y + 4"
        class="drop-tag"
      >
        📦
      </text>
      <g v-for="r in game.riders" :key="r.id">
        <circle
          :cx="riderXY(game, r).x"
          :cy="riderXY(game, r).y"
          r="3"
          class="rider-dot"
          :class="{ hold: r.hold }"
        />
        <text
          :x="riderXY(game, r).x"
          :y="riderXY(game, r).y + 1.8"
          class="rider-emoji"
        >
          🛵
        </text>
      </g>
    </svg>
    <div class="map-legend">
      <span>● 街区</span><span>🛵 骑手</span><span>📦 待送达</span
      ><span v-if="game.closedEdges.length">⛔ 封路中</span>
    </div>
  </div>
</template>
