<script setup lang="ts">
import { computed } from "vue";
import type { Game, Command } from "../../../shared/types";
import { nodeName } from "../lib/map";

const props = defineProps<{ game: Game }>();
defineEmits<{ command: [cmd: Command] }>();

const alert = computed(() => props.game.closureAlert);
const riderName = computed(
  () =>
    props.game.riders.find((r) => r.id === alert.value?.riderId)?.name ??
    "骑手",
);
function pathText(path: number[]) {
  const names = path.map(nodeName);
  return names.length > 6 ? names.slice(0, 6).join(" → ") + " …" : names.join(" → ");
}
</script>
<template>
  <div v-if="alert" class="closure-banner">
    <div class="closure-head">
      <b>⛔ {{ nodeName(alert.a) }} ↔ {{ nodeName(alert.b) }} 封闭</b>
      <span
        >剩余 {{ Math.max(0, Math.ceil(alert.until - game.time)) }}s ·
        {{ riderName }} 需绕行，请决定保高价单还是先救临期单</span
      >
    </div>
    <div class="closure-options">
      <div
        v-for="opt in alert.options"
        :key="opt.strategy"
        class="closure-option"
      >
        <b>{{ opt.strategy === "deadline" ? "先救临期单" : "先保高价单" }}</b>
        <small>{{ pathText(opt.path) }}</small>
        <small
          >预计损失 <b class="red">¥{{ opt.loss }}</b> · 约
          {{ Math.max(0, Math.ceil(opt.eta - game.time)) }}s 跑完</small
        >
        <button
          class="tiny"
          @click="$emit('command', { type: 'reroute', strategy: opt.strategy })"
        >
          采用此方案
        </button>
      </div>
      <div class="closure-option">
        <b>维持当前顺序</b>
        <small>不调整站点顺序，按原计划绕行</small>
        <button
          class="tiny soft"
          @click="$emit('command', { type: 'dismiss-closure' })"
        >
          继续
        </button>
      </div>
    </div>
  </div>
</template>
