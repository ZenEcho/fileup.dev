<script setup lang="ts">
import { toRef } from 'vue'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NUpload,
  NAlert,
  NCheckbox,
  NCheckboxGroup,
  NSpace,
} from 'naive-ui'
import { usePluginTester } from '@frontend/composables'

const props = defineProps<{
  content: unknown
}>()

const {
  t,
  hasErrors,
  pluginContent,
  isInputVisible,
  isInputDisabled,
  configFields,
  dynamicOptions,
  getInputPlaceholder,
  getInputHelp,
  getInputDataSource,
  dataSourceErrors,
  isFetchingSource,
  canResolveInputSource,
  runDataSourceScript,
  kvPairRows,
  updateKvRowKey,
  updateKvRowValue,
  removeKvRow,
  addKvRow,
  handleUploadChange,
  runTest,
  isTesting,
  testError,
  testResult,
} = usePluginTester(toRef(props, 'content'))
</script>
<template>
  <div class="mt-4">
    <NAlert v-if="hasErrors" type="warning" :title="t('pluginPreview.invalidTitle')">
      {{ t('submit.fixJsonToTest') }}
    </NAlert>

    <NCard v-else-if="pluginContent" size="small" :bordered="false" class="bg-gray-50 rounded-xl">
      <template #header>
        <div class="text-base font-semibold">{{ t('submit.testArea') }}</div>
      </template>

      <NForm label-placement="top" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
          <template v-for="(input, index) in pluginContent.inputs" :key="`${input.name}-${index}`">
            <NFormItem v-if="isInputVisible(input)" :label="input.label || input.name" :required="input.required === true"
              :class="{ 'md:col-span-2': input.type === 'textarea' || input.type === 'kv-pairs' }">
              <div class="w-full space-y-1">
                <template v-if="input.type === 'select'">
                  <NSelect v-model:value="configFields[input.name]"
                    :options="dynamicOptions[input.name] || input.options || []"
                    :placeholder="getInputPlaceholder(input, t('submit.selectPlaceholder'))" class="w-full"
                    :filterable="input.filterable || !!input.dataSource" :clearable="input.clearable" :tag="input.tag"
                    :multiple="input.multiple" :disabled="isInputDisabled(input)" />
                </template>
                <template v-else-if="input.type === 'switch'">
                  <NSwitch v-model:value="configFields[input.name]" :disabled="isInputDisabled(input)" />
                </template>
                <template v-else-if="input.type === 'checkbox'">
                  <template v-if="dynamicOptions[input.name] || input.options">
                    <NCheckboxGroup v-model:value="configFields[input.name]" :disabled="isInputDisabled(input)">
                      <NSpace>
                        <NCheckbox v-for="opt in (dynamicOptions[input.name] || input.options || [])"
                          :key="String(opt.value)" :value="opt.value">
                          {{ opt.label }}
                        </NCheckbox>
                      </NSpace>
                    </NCheckboxGroup>
                  </template>
                  <template v-else>
                    <NCheckbox v-model:checked="configFields[input.name]" :disabled="isInputDisabled(input)">
                      {{ getInputPlaceholder(input, input.label || input.name) }}
                    </NCheckbox>
                  </template>
                </template>
                <template v-else-if="input.type === 'textarea'">
                  <NInput v-model:value="configFields[input.name]" type="textarea"
                    :placeholder="getInputPlaceholder(input, input.name)" class="w-full" :disabled="isInputDisabled(input)"
                    :autosize="{ minRows: 3, maxRows: 6 }" />
                </template>
                <template v-else-if="input.type === 'number'">
                  <NInputNumber v-model:value="configFields[input.name]" class="w-full"
                    :placeholder="getInputPlaceholder(input, input.name)" :disabled="isInputDisabled(input)" />
                </template>
                <template v-else-if="input.type === 'kv-pairs'">
                  <div class="space-y-2">
                    <div v-for="(row, rowIndex) in (kvPairRows[input.name] || [])" :key="`${input.name}-kv-${rowIndex}`"
                      class="flex items-center gap-2">
                      <NInput :value="row.key" placeholder="Key" :disabled="isInputDisabled(input)"
                        @update:value="(value) => updateKvRowKey(input.name, rowIndex, value)" />
                      <NInput :value="row.value" placeholder="Value" :disabled="isInputDisabled(input)"
                        @update:value="(value) => updateKvRowValue(input.name, rowIndex, value)" />
                      <NButton size="small" quaternary type="error" :disabled="isInputDisabled(input)"
                        @click="removeKvRow(input.name, rowIndex)">
                        -
                      </NButton>
                    </div>
                    <NButton size="small" tertiary :disabled="isInputDisabled(input)" @click="addKvRow(input.name)">
                      +
                    </NButton>
                  </div>
                </template>
                <template v-else>
                  <NInput v-model:value="configFields[input.name]"
                    :type="input.type === 'password' ? 'password' : 'text'"
                    :show-password-on="input.type === 'password' ? 'click' : undefined"
                    :placeholder="getInputPlaceholder(input, input.name)" class="w-full"
                    :disabled="isInputDisabled(input)" />
                </template>

                <div v-if="getInputDataSource(input)" class="flex items-center justify-between gap-3 text-xs">
                  <div class="min-h-[18px] text-red-500 break-words">{{ dataSourceErrors[input.name] }}</div>
                  <NButton quaternary size="tiny" :loading="isFetchingSource[input.name]"
                    :disabled="isInputDisabled(input) || !canResolveInputSource(input)"
                    @click="runDataSourceScript(input.name)">
                    {{ input.dataSource?.actionLabel || t('submit.fetchBtn') }}
                  </NButton>
                </div>

                <div v-if="getInputHelp(input)" class="text-xs text-gray-500 whitespace-pre-wrap break-words leading-snug">
                  {{ getInputHelp(input) }}
                </div>
              </div>
            </NFormItem>
          </template>

          <NFormItem :label="t('submit.testFile')" class="md:col-span-2">
            <NUpload :max="1" accept="image/*" @change="handleUploadChange">
              <NButton>{{ t('submit.selectFile') }}</NButton>
            </NUpload>
          </NFormItem>
        </div>
      </NForm>

      <div class="flex justify-end gap-2 mb-4">
        <NButton type="primary" :loading="isTesting" @click="runTest">
          {{ t('submit.runTestBtn') }}
        </NButton>
      </div>

      <NAlert v-if="testError" type="error" class="mb-4 whitespace-pre-wrap word-break-all">
        {{ testError }}
      </NAlert>

      <NAlert v-if="testResult" type="success" :title="t('submit.testSuccess')" class="word-break-all">
        <a v-if="testResult.startsWith('http')" :href="testResult" target="_blank">{{ testResult }}</a>
        <span v-else>{{ testResult }}</span>
      </NAlert>
    </NCard>
  </div>
</template>

<style scoped>
.word-break-all {
  word-break: break-all;
}
</style>


