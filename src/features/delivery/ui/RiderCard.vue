<script setup lang="ts">
import type { Game, Command, Rider, Parcel } from "../../../shared/types";
import { recipes } from "../../../shared/catalog";
import { nodeName } from "../lib/map";
import { parcelQuality } from "../lib/transit";

const props = defineProps<{ game: Game; rider: Rider }>();
defineEmits<{ command: [cmd: Command] }>();

function statusText() {
  const r = props.rider,
    g = props.game;
  if (r.hold) return "等待绕行指令";
  if (r.leg) return `前往${nodeName(r.leg.to)}`;
  if (!r.stops.length) return "在店待命";
  if (r.at === 0 && r.departAt !== null)
    return `${Math.max(0, Math.ceil(r.departAt - g.time))}s 后发车`;
  return "配送中";
}
function parcelsOnBoard(): Parcel[] {
  return props.rider.parcels
    .map((id) => props.game.parcels.find((p) => p.id === id))
    .filter((p): p is Parcel => !!p);
}
</script>
<template>
  <article class="rider-card" :class="{ hold: rider.hold }">
    <div class="rider-head">
      <b>🛵 {{ rider.name }}</b>
      <span class="rider-status">{{ statusText() }}</span>
    </div>
    <div class="rider-load">
      <span
        v-for="i in rider.capacity"
        :key="i"
        class="slot"
        :class="{ filled: i <= rider.parcels.length }"
      ></span>
      <small>{{ rider.parcels.length }}/{{ rider.capacity }} 件</small>
      <button
        v-if="rider.at === 0 && !rider.leg && rider.departAt !== null"
        class="tiny"
        @click="$emit('command', { type: 'depart', rider: rider.id })"
      >
        立即发车
      </button>
    </div>
    <div v-if="parcelsOnBoard().length" class="rider-parcels">
      <div v-for="p in parcelsOnBoard()" :key="p.id" class="rider-parcel">
        <span
          >{{ recipes[p.recipe].icon }} #{{ p.orderId
          }}{{ p.insulated ? " 🧊" : "" }}</span
        >
        <div class="q-bar">
          <i :style="{ width: parcelQuality(game, p) + '%' }"></i>
        </div>
        <small>{{ parcelQuality(game, p) }}</small>
      </div>
    </div>
    <ol v-if="rider.stops.length" class="rider-stops">
      <li v-for="(s, i) in rider.stops" :key="i">
        {{ s.kind === "pickup" ? "取" : "送" }} #{{ s.orderId }} ·
        {{ nodeName(s.node) }}
      </li>
    </ol>
  </article>
</template>
