<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: string | number
  icon: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  iconClass?: string
}>()

const trendColor = computed(() => {
  if (props.trend === 'up') return 'text-emerald-500'
  if (props.trend === 'down') return 'text-rose-500'
  return 'text-gray-400'
})

const trendIcon = computed(() => {
  if (props.trend === 'up') return 'i-ph-trend-up-bold'
  if (props.trend === 'down') return 'i-ph-trend-down-bold'
  return 'i-ph-minus-bold'
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md group">
    <div class="flex justify-between items-start mb-2">
      <div class="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
        {{ title }}
      </div>
      <div 
        class="w-8 h-8 rounded-lg flex items-center justify-center opacity-80"
        :class="iconClass || 'bg-cyan-50 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400'"
      >
        <div :class="icon" class="text-lg" />
      </div>
    </div>
    
    <div class="flex items-end gap-3">
      <div class="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
        {{ value }}
      </div>
      
      <div v-if="trend" class="flex items-center gap-1 text-sm font-medium mb-1" :class="trendColor">
        <div :class="trendIcon" />
        <span v-if="trendValue">{{ trendValue }}</span>
      </div>
    </div>
  </div>
</template>
