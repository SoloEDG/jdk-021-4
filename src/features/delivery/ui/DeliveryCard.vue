<script setup lang="ts">
import type {
  Game,
  Command,
  DeliveryOrder,
  DeliveryStatus,
} from "../../../shared/types";
import { recipes } from "../../../shared/catalog";
import { nodeName } from "../lib/map";
import { parcelQuality } from "../lib/transit";

const props = defineProps<{ game: Game; order: DeliveryOrder }>();
defineEmits<{ command: [cmd: Command] }>();

const labels: Record<DeliveryStatus, string> = {
  incoming: "待接单",
  accepted: "待打包",
  packed: "待取餐",
  assigned: "待取餐",
  picked: "配送中",
  delivered: "已送达",
  cancelled: "已取消",
};

function deadlineInfo() {
  const o = props.order,
    t = props.game.time;
  if (o.status === "incoming") return { label: "接单", left: o.acceptBy - t };
  if (o.status === "picked") return { label: "送达", left: o.deliverBy - t };
  return { label: "取餐", left: o.pickupBy - t };
}
function selectedDish() {
  return props.game.dishes.find((d) => d.id === props.game.selectedDish);
}
function canPack() {
  const d = selectedDish();
  return !!d && d.stage === "plated" && d.recipe === props.order.recipe;
}
function parcel() {
  return props.game.parcels.find((p) => p.id === props.order.parcelId);
}
function riderName(id: number | null) {
  return props.game.riders.find((r) => r.id === id)?.name ?? "骑手";
}
function riderLoad(id: number) {
  const r = props.game.riders.find((r) => r.id === id);
  if (!r) return "";
  const load =
    r.parcels.length + r.stops.filter((s) => s.kind === "pickup").length;
  return `${r.name} ${load}/${r.capacity}`;
}
function riderEnroute(id: number) {
  const r = props.game.riders.find((r) => r.id === id);
  return !!r && (r.leg !== null || r.at !== 0);
}
</script>
<template>
  <article class="d-order" :class="{ urgent: deadlineInfo().left < 15 }">
    <div class="d-order-top">
      <b>#{{ String(order.id).padStart(3, "0") }}</b>
      <span class="chip">{{ labels[order.status] }}</span>
      <span class="d-eta"
        >{{ deadlineInfo().label }}剩
        {{ Math.max(0, Math.ceil(deadlineInfo().left)) }}s</span
      >
      <button
        class="d-cancel"
        aria-label="取消订单"
        @click="$emit('command', { type: 'cancel-delivery', id: order.id })"
      >
        ×
      </button>
    </div>
    <div class="d-order-main">
      <span class="d-icon">{{ recipes[order.recipe].icon }}</span>
      <div>
        <b>{{ recipes[order.recipe].name }} · ¥{{ order.price }}</b>
        <small>{{ order.customer }} → {{ nodeName(order.node) }}</small>
      </div>
    </div>
    <div v-if="order.status === 'incoming'" class="d-actions">
      <button
        class="tiny"
        @click="$emit('command', { type: 'accept-delivery', id: order.id })"
      >
        接单
      </button>
    </div>
    <div v-else-if="order.status === 'accepted'" class="d-actions d-pack">
      <small v-if="selectedDish()">
        已选 {{ recipes[selectedDish()!.recipe].name }} #{{
          selectedDish()!.id
        }}{{ canPack() ? "" : " · 需已装盘且菜品匹配" }}
      </small>
      <small v-else
        >请先在出餐台选择已装盘的 {{ recipes[order.recipe].name }}</small
      >
      <div>
        <button
          class="tiny soft"
          :disabled="!canPack()"
          @click="
            $emit('command', { type: 'pack', order: order.id, insulated: false })
          "
        >
          📦 打包
        </button>
        <button
          class="tiny soft"
          :disabled="!canPack()"
          @click="
            $emit('command', { type: 'pack', order: order.id, insulated: true })
          "
        >
          🧊 保温打包 ¥2
        </button>
      </div>
    </div>
    <div v-else-if="order.status === 'packed'" class="d-actions">
      <button
        v-for="r in game.riders"
        :key="r.id"
        class="tiny"
        @click="
          $emit('command', { type: 'assign', order: order.id, rider: r.id })
        "
      >
        {{ riderLoad(r.id) }}{{ riderEnroute(r.id) ? " · 途中追加" : "" }}
      </button>
    </div>
    <div v-else-if="order.status === 'assigned'" class="d-actions">
      <small>等待 {{ riderName(order.riderId) }} 取餐…</small>
    </div>
    <div v-else-if="order.status === 'picked'" class="d-actions">
      <small
        >{{ riderName(order.riderId) }} 配送中 · 包裹品质
        {{ parcel() ? parcelQuality(game, parcel()!) : 0 }}</small
      >
    </div>
  </article>
</template>
