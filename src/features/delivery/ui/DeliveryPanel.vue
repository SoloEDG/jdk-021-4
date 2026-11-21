<script setup lang="ts">
import type { Game, Command } from "../../../shared/types";
import { activeDeliveries } from "../model/orders";
import DeliveryCard from "./DeliveryCard.vue";
import BlockMap from "./BlockMap.vue";
import RiderCard from "./RiderCard.vue";
import ClosureBanner from "./ClosureBanner.vue";

defineProps<{ game: Game }>();
defineEmits<{ command: [cmd: Command] }>();

const rank: Record<string, number> = {
  incoming: 0,
  accepted: 1,
  packed: 2,
  assigned: 3,
  picked: 4,
};
function sorted(g: Game) {
  return activeDeliveries(g).sort(
    (a, b) => rank[a.status] - rank[b.status] || a.pickupBy - b.pickupBy,
  );
}
</script>
<template>
  <section class="panel delivery-panel">
    <div class="section-heading">
      <div>
        <span class="eyebrow">05 / DELIVERY</span>
        <h2>
          外卖配送 <span class="count">{{ activeDeliveries(game).length }}</span>
        </h2>
      </div>
      <span class="muted"
        >已送达 {{ game.delivered }} 单 · 打包后不可再上堂食 ·
        送达且品质≥30 才确认收入</span
      >
    </div>
    <ClosureBanner
      :game="game"
      @command="(c) => $emit('command', c)"
    />
    <div class="delivery-grid">
      <div class="delivery-orders">
        <DeliveryCard
          v-for="o in sorted(game)"
          :key="o.id"
          :game="game"
          :order="o"
          @command="(c) => $emit('command', c)"
        />
        <div v-if="!activeDeliveries(game).length" class="empty">
          暂无外卖订单，留意接单提示。
        </div>
      </div>
      <div class="delivery-side">
        <BlockMap :game="game" />
        <RiderCard
          v-for="r in game.riders"
          :key="r.id"
          :game="game"
          :rider="r"
          @command="(c) => $emit('command', c)"
        />
      </div>
    </div>
  </section>
</template>
