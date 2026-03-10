<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NAlert, NCard } from 'naive-ui'
import PluginTester from '@frontend/components/PluginTester.vue'
import { PluginContentPreview } from '@common/ui'

interface ParsedContentState {
  content: Record<string, unknown> | null
  error: string
}

defineProps<{
  parsedContentState: ParsedContentState
}>()

const { t } = useI18n()
</script>

<template>
  <div class="sticky top-20 flex flex-col gap-6">
    <NCard size="small" class="shadow-sm rounded-xl border-t-4 border-t-blue-500">
      <template #header>
        <div class="flex items-center gap-2">
          <div class="i-ph-flask text-blue-500 text-lg"></div>
          <span class="font-semibold">{{ t('submit.testArea') }}</span>
        </div>
      </template>
      <NAlert v-if="parsedContentState.error" type="warning" :title="t('submit.invalidJson')">
        {{ parsedContentState.error }}
      </NAlert>
      <PluginTester v-else :content="parsedContentState.content" />
    </NCard>

    <NCard size="small" class="shadow-sm rounded-xl bg-gray-50/70 border border-gray-100">
      <template #header>
        <div class="flex items-center gap-2">
          <div class="i-ph-eye text-gray-500 text-lg"></div>
          <span class="font-semibold text-gray-700">{{ t('submit.configPreview') }}</span>
        </div>
      </template>
      <NAlert v-if="parsedContentState.error" type="warning" :title="t('submit.invalidJson')">
        {{ parsedContentState.error }}
      </NAlert>
      <PluginContentPreview v-else :content="parsedContentState.content" show-raw-json />
    </NCard>
  </div>
</template>
