<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NAvatar, NButton, NCard, NEmpty, NGrid, NGridItem, NTag } from 'naive-ui'
import type { PluginMarketplaceItem } from '@common/types'

const props = defineProps<{
  loading: boolean
  filteredPlugins: PluginMarketplaceItem[]
  onOpenDetails: (plugin: PluginMarketplaceItem) => void
  onInstall: (plugin: PluginMarketplaceItem) => void
  onToggle: (id: string, enabled: boolean) => void
  onUninstall: (id: string) => void
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="loading" class="flex justify-center py-20">
    <div class="animate-spin text-4xl text-primary">⌛</div>
  </div>
  <div v-else-if="!filteredPlugins.length" class="py-16">
    <NEmpty :description="t('marketplace.filters.empty')" size="large" />
  </div>
  <NGrid v-else x-gap="24" y-gap="24" cols="1 s:2 m:3" responsive="screen">
    <NGridItem v-for="plugin in filteredPlugins" :key="plugin.id">
      <NCard hoverable class="h-full border-border rounded-xl transition-all hover:-translate-y-1">
        <div class="flex items-start justify-between mb-4">
          <div
            class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
            <img v-if="plugin.icon.startsWith('http')" :src="plugin.icon" class="w-full h-full object-cover" />
            <div v-else :class="[plugin.icon, 'text-2rem']" />
          </div>
          <div class="flex flex-col items-end">
            <NTag :type="plugin.installed ? (plugin.enabled ? 'success' : 'warning') : 'default'" size="small" round
              class="mb-1">
              {{ plugin.installed ? (plugin.enabled ? t('marketplace.installed') : t('marketplace.disable')) :
                t('marketplace.install') }}
            </NTag>
            <span class="text-0.75rem text-text-tertiary">v{{ plugin.version }}</span>
          </div>
        </div>

        <div class="mb-2 flex items-center gap-2">
          <h3 class="text-1.2rem font-700 text-text-main m-0">{{ plugin.name }}</h3>
          <NTag size="small" round type="info">
            {{
              plugin.kind === 'site-detector'
                ? t('marketplace.kindSiteDetector')
                : plugin.kind === 'editor-adapter'
                  ? t('marketplace.kindEditorAdapter')
                  : t('marketplace.kindUploader')
            }}
          </NTag>
        </div>
        <p class="text-text-secondary text-0.9rem mb-4 line-clamp-2 min-h-2.7em">
          {{ plugin.description }}
        </p>

        <div class="flex items-center gap-4 text-0.8rem text-text-tertiary mb-6">
          <span class="flex items-center gap-1">
            <NAvatar v-if="plugin.author.avatar" :src="plugin.author.avatar" round size="small" />
            <div v-else class="i-ph-user" />
            {{ plugin.author.username || 'Unknown' }}
          </span>
          <span class="flex items-center gap-1">
            <div class="i-ph-download-simple" /> {{ plugin.downloads }}
          </span>
        </div>

        <template #action>
          <div class="flex flex-col gap-2">
            <NButton block secondary @click="onOpenDetails(plugin)">
              {{ t('marketplace.viewDetails') }}
            </NButton>

            <NButton v-if="!plugin.installed" block type="primary" @click="onInstall(plugin)">
              {{ t('marketplace.install') }}
            </NButton>

            <div v-else class="flex gap-2">
              <NButton flex-1 :type="plugin.enabled ? 'warning' : 'success'" secondary
                @click="onToggle(plugin.id, !plugin.enabled)">
                {{ plugin.enabled ? t('marketplace.disable') : t('marketplace.enable') }}
              </NButton>
              <NButton type="error" secondary @click="onUninstall(plugin.id)">
                {{ t('marketplace.uninstall') }}
              </NButton>
            </div>
          </div>
        </template>
      </NCard>
    </NGridItem>
  </NGrid>
</template>
