<script setup lang="ts">
defineProps<{
  points: Array<{
    label: string
    count: number
    height: number
  }>
}>()
</script>

<template>
  <div class="flex items-end gap-2 h-[200px] w-full mt-4">
    <div v-for="item in points" :key="item.label" class="flex flex-col items-center justify-end flex-1 min-w-[20px] h-full group relative">
      <div class="absolute -top-8 bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
        {{ item.count }} 次
      </div>
      <div 
        class="w-full max-w-[32px] bg-teal-500/30 dark:bg-teal-500/50 rounded-t-sm group-hover:bg-teal-500 transition-colors"
        :style="{ height: `${Math.max(item.height, 2)}%` }" 
      />
      <span class="text-[10px] text-gray-500 dark:text-gray-400 mt-2 truncate w-full text-center">
        {{ item.label.split('/')[1] || item.label }}
      </span>
    </div>
  </div>
</template>
