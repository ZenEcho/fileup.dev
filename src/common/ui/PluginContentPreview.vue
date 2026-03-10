<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NCode, NCollapse, NCollapseItem, NEmpty, NSpace, NTag } from 'naive-ui'
import { getPluginAuthorName, getPluginContentStats, toPrettyJson, validatePluginContent, type PluginInputSchema } from '@common/utils/plugin'

const props = withDefaults(defineProps<{
  content: unknown
  showRawJson?: boolean
}>(), {
  showRawJson: false
})

const { t } = useI18n()

const validation = computed(() => validatePluginContent(props.content))
const stats = computed(() => getPluginContentStats(props.content))
const normalizedContent = computed(() => validation.value.content ?? null)
const rawJson = computed(() => toPrettyJson(props.content))

const getConditionJson = (value: unknown) => toPrettyJson(value)
const getDefaultJson = (value: unknown) => toPrettyJson(value)
const getOptionsCount = (input: PluginInputSchema) => Array.isArray(input.options) ? input.options.length : 0
const getInputKey = (input: PluginInputSchema, index: number) => `${input.name}-${index}`
const getAuthorName = (author: unknown) => getPluginAuthorName(author, '-')
</script>

<template>
  <div class="flex flex-col gap-4">
    <NAlert v-if="!validation.valid" type="error" :title="t('pluginPreview.invalidTitle')">
      <ul class="m-0 pl-5">
        <li v-for="error in validation.errors" :key="error">{{ error }}</li>
      </ul>
    </NAlert>

    <template v-else-if="normalizedContent">
      <NSpace>
        <NTag round>{{ t('pluginPreview.stats.inputs', { count: stats.inputCount }) }}</NTag>
        <NTag round type="info">{{ t('pluginPreview.stats.dataSources', { count: stats.dataSourceCount }) }}</NTag>
        <NTag round type="warning">{{ t('pluginPreview.stats.conditions', { count: stats.conditionalCount }) }}</NTag>
        <NTag round type="success">{{ t('pluginPreview.stats.scripts', {
          count: stats.configScriptCount +
            stats.uploadScriptCount
        }) }}</NTag>
      </NSpace>

      <div class="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <div><strong>{{ t('pluginPreview.id') }}:</strong> {{ normalizedContent.id }}</div>
        <div><strong>{{ t('pluginPreview.name') }}:</strong> {{ normalizedContent.name }}</div>
        <div><strong>{{ t('pluginPreview.version') }}:</strong> {{ normalizedContent.version }}</div>
        <div><strong>{{ t('pluginPreview.author') }}:</strong> {{ getAuthorName(normalizedContent.author) }}</div>
        <div><strong>{{ t('pluginPreview.description') }}:</strong> {{ normalizedContent.description || '-' }}</div>
        <div><strong>{{ t('pluginPreview.icon') }}:</strong> {{ normalizedContent.icon || '-' }}</div>
      </div>

      <NCollapse>
        <NCollapseItem :title="t('pluginPreview.inputsTitle', { count: normalizedContent.inputs.length })"
          name="inputs">
          <div v-if="normalizedContent.inputs.length === 0" class="py-2">
            <NEmpty :description="t('pluginPreview.noInputs')" size="small" />
          </div>

          <div v-else class="flex flex-col gap-3">
            <div v-for="(input, index) in normalizedContent.inputs" :key="getInputKey(input, index)"
              class="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class="font-semibold text-gray-800">{{ input.label || input.name }}</span>
                <NTag size="small" round>{{ input.type || 'text' }}</NTag>
                <NTag v-if="input.required" size="small" round type="error">{{ t('pluginPreview.required') }}</NTag>
                <NTag v-if="input.multiple" size="small" round type="info">multiple</NTag>
                <NTag v-if="input.tag" size="small" round type="info">tag</NTag>
                <NTag v-if="input.filterable" size="small" round type="info">filterable</NTag>
                <NTag v-if="input.clearable" size="small" round type="info">clearable</NTag>
              </div>

              <div class="mb-2 text-xs text-gray-500">{{ input.name }}</div>
              <div v-if="input.placeholder" class="mb-1 text-sm text-gray-600">
                <strong>{{ t('pluginPreview.placeholder') }}:</strong> {{ input.placeholder }}
              </div>
              <div v-if="input.help" class="mb-1 text-sm text-gray-600">
                <strong>{{ t('pluginPreview.help') }}:</strong> {{ input.help }}
              </div>
              <div v-if="input.default !== undefined" class="mb-1 text-sm text-gray-600">
                <strong>{{ t('pluginPreview.defaultValue') }}:</strong>
                <NCode :code="getDefaultJson(input.default)" language="json" word-wrap />
              </div>
              <div v-if="getOptionsCount(input) > 0" class="mb-1 text-sm text-gray-600">
                <strong>{{ t('pluginPreview.optionsCount') }}:</strong> {{ getOptionsCount(input) }}
              </div>

              <div v-if="input.visibleWhen" class="mt-3">
                <div class="mb-1 text-sm font-semibold text-gray-700">{{ t('pluginPreview.visibleWhen') }}</div>
                <NCode :code="getConditionJson(input.visibleWhen)" language="json" word-wrap />
              </div>

              <div v-if="input.disabledWhen" class="mt-3">
                <div class="mb-1 text-sm font-semibold text-gray-700">{{ t('pluginPreview.disabledWhen') }}</div>
                <NCode :code="getConditionJson(input.disabledWhen)" language="json" word-wrap />
              </div>

              <div v-if="input.dataSource" class="mt-3">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <span class="text-sm font-semibold text-gray-700">{{ t('pluginPreview.dataSource') }}</span>
                  <NTag size="small" round :type="input.dataSource.manual ? 'warning' : 'success'">
                    {{ input.dataSource.manual ? t('pluginPreview.manual') : t('pluginPreview.automatic') }}
                  </NTag>
                </div>
                <div v-if="input.dataSource.watch?.length" class="mb-1 text-sm text-gray-600">
                  <strong>{{ t('pluginPreview.watchFields') }}:</strong> {{ input.dataSource.watch.join(', ') }}
                </div>
                <div v-if="input.dataSource.required?.length" class="mb-1 text-sm text-gray-600">
                  <strong>{{ t('pluginPreview.requiredFields') }}:</strong> {{ input.dataSource.required.join(', ') }}
                </div>
                <div v-if="input.dataSource.actionLabel" class="mb-1 text-sm text-gray-600">
                  <strong>{{ t('pluginPreview.actionLabel') }}:</strong> {{ input.dataSource.actionLabel }}
                </div>
                <div class="mt-2">
                  <div class="mb-1 text-sm font-semibold text-gray-700">{{ t('pluginPreview.configScript') }}</div>
                  <NCode :code="input.dataSource.script" language="javascript" word-wrap />
                </div>
              </div>
            </div>
          </div>
        </NCollapseItem>

        <NCollapseItem :title="t('pluginPreview.uploadScript')" name="upload-script">
          <NCode :code="normalizedContent.script" language="javascript" word-wrap />
        </NCollapseItem>

        <NCollapseItem v-if="showRawJson" :title="t('pluginPreview.rawJson')" name="raw-json">
          <NCode :code="rawJson" language="json" word-wrap />
        </NCollapseItem>
      </NCollapse>
    </template>
  </div>
</template>
