import { ref, computed } from 'vue'
import type { ComputedRef } from 'vue'
import { analyzePluginRisk } from '@backstage/composables'
import type { PendingItem } from '@common/types'

export function useAdminRisk(pendingItems: ComputedRef<PendingItem[]>) {
  const riskModalVisible = ref(false)
  const riskModalData = ref<{ title: string; score: number; level: string; rules: string[]; script: string } | null>(null)

  const riskRows = computed(() => {
    return pendingItems.value.map((item) => {
      const risk = analyzePluginRisk(item.content)
      return {
        key: item.key,
        pluginName: item.plugin.name,
        pluginId: item.plugin.id,
        version: item.version.version,
        score: risk.score,
        level: risk.level,
        rules: risk.rules,
        script: risk.script,
      }
    })
  })

  const showRiskModal = (key: string) => {
    const row = riskRows.value.find((item) => item.key === key)
    if (!row) return
    riskModalData.value = {
      title: `${row.pluginName} v${row.version}`,
      score: row.score,
      level: row.level,
      rules: row.rules,
      script: row.script,
    }
    riskModalVisible.value = true
  }

  return {
    riskRows,
    riskModalVisible,
    riskModalData,
    showRiskModal,
  }
}
