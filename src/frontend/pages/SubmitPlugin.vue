<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  useMessage,
} from 'naive-ui'
import { useAuthStore } from '@common/stores/auth'
import { createPlugin, fetchPluginDetail } from '@common/api'
import { ScriptCodeEditor } from '@common/ui'
import type { PluginStatus } from '@common/types'
import { SubmitTestAndPreview } from '@frontend/sections/submit'
import { getPluginAuthorName, validatePluginContent } from '@common/utils/plugin'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const { t } = useI18n()

const formRef = ref(null)
const model = ref({
  id: '',
  name: '',
  description: '',
  icon: '',
  version: '1.0.0',
  author: '',
  script: '',
  content: '{}',
  changelog: ''
})

const isSyncing = ref(false)
const loading = ref(false)

type JsonRecord = Record<string, unknown>

interface ConfigScriptEditor {
  key: string
  inputIndex: number
  inputName: string
  inputLabel: string
  script: string
}

const configScripts = ref<ConfigScriptEditor[]>([])

const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value)

const extractConfigScripts = (content: unknown): ConfigScriptEditor[] => {
  if (!isRecord(content) || !Array.isArray(content.inputs)) {
    return []
  }

  return content.inputs.flatMap((input, inputIndex) => {
    if (!isRecord(input) || !isRecord(input.dataSource)) {
      return []
    }

    const inputName = typeof input.name === 'string' && input.name.trim() ? input.name : `inputs[${inputIndex}]`
    const inputLabel = typeof input.label === 'string' ? input.label : ''
    const script = typeof input.dataSource.script === 'string' ? input.dataSource.script : ''

    return [{
      key: `${inputIndex}:${inputName}`,
      inputIndex,
      inputName,
      inputLabel,
      script
    }]
  })
}

const applyConfigScriptsToContent = (content: JsonRecord, editors: ConfigScriptEditor[]) => {
  if (!Array.isArray(content.inputs)) {
    return false
  }

  let changed = false

  for (const editor of editors) {
    const input = content.inputs[editor.inputIndex]
    if (!isRecord(input) || !isRecord(input.dataSource)) {
      continue
    }

    const currentScript = typeof input.dataSource.script === 'string' ? input.dataSource.script : ''
    if (currentScript !== editor.script) {
      input.dataSource.script = editor.script
      changed = true
    }
  }

  return changed
}

type PluginAuditStatus = PluginStatus

const isEditMode = computed(() => !!route.query.edit)
const latestVersionInEditMode = ref('')
const latestVersionStatusInEditMode = ref<PluginAuditStatus | ''>('')
const configScriptSignature = computed(() => configScripts.value.map((item) => `${item.key}:${item.script}`).join('||'))

const parsedContentState = computed(() => {
  if (!model.value.content.trim()) {
    return { content: null as Record<string, unknown> | null, error: '' }
  }

  try {
    return {
      content: JSON.parse(model.value.content) as Record<string, unknown>,
      error: ''
    }
  } catch {
    return {
      content: null,
      error: t('submit.invalidJson')
    }
  }
})

watch(
  () => [model.value.id, model.value.name, model.value.description, model.value.icon, model.value.version, model.value.author, model.value.script, configScriptSignature.value],
  () => {
    if (isSyncing.value) return

    try {
      const parsedContent = model.value.content ? JSON.parse(model.value.content) : {}
      if (!isRecord(parsedContent)) return

      const content = parsedContent
      let changed = false

      if (model.value.id && content.id !== model.value.id) { content.id = model.value.id; changed = true }
      if (model.value.name && content.name !== model.value.name) { content.name = model.value.name; changed = true }
      if (model.value.version && content.version !== model.value.version) { content.version = model.value.version; changed = true }
      if (model.value.description && content.description !== model.value.description) { content.description = model.value.description; changed = true }
      if (model.value.icon !== undefined && content.icon !== model.value.icon) { content.icon = model.value.icon; changed = true }

      const currentAuthor = getPluginAuthorName(content.author, '')
      if (model.value.author && currentAuthor !== model.value.author) {
        content.author = model.value.author
        changed = true
      }

      if (content.script !== model.value.script) {
        content.script = model.value.script
        changed = true
      }

      if (applyConfigScriptsToContent(content, configScripts.value)) {
        changed = true
      }

      if (changed) {
        isSyncing.value = true
        model.value.content = JSON.stringify(content, null, 2)
        setTimeout(() => { isSyncing.value = false }, 0)
      }
    } catch {
      // Ignore JSON parse errors while typing in form
    }
  }
)

watch(
  () => model.value.content,
  (newVal) => {
    if (isSyncing.value) return

    try {
      const content = JSON.parse(newVal)
      if (!isRecord(content)) return

      isSyncing.value = true

      if (typeof content.id === 'string') model.value.id = content.id
      if (typeof content.name === 'string') model.value.name = content.name
      if (typeof content.version === 'string') model.value.version = content.version
      if (typeof content.description === 'string') model.value.description = content.description
      if (typeof content.icon === 'string') model.value.icon = content.icon
      if (content.author !== undefined) model.value.author = getPluginAuthorName(content.author, '')
      model.value.script = typeof content.script === 'string' ? content.script : ''
      configScripts.value = extractConfigScripts(content)

      setTimeout(() => { isSyncing.value = false }, 0)
    } catch {
      // Ignore invalid JSON while typing
    }
  }
)

const rules = {
  id: { required: true, message: 'ID is required', trigger: 'blur' },
  name: { required: true, message: 'Name is required', trigger: 'blur' },
  version: { required: true, message: 'Version is required', trigger: 'blur' },
  content: { required: true, message: 'Content is required', trigger: 'blur' }
}

const fetchPluginData = async (id: string) => {
  loading.value = true
  try {
    const res = await fetchPluginDetail(id, true)
    const plugin = res.data
    const latestVersion = plugin.versions[0]
    const latestContent = (latestVersion?.content || {}) as Record<string, any>

    latestVersionInEditMode.value = latestVersion?.version || ''
    latestVersionStatusInEditMode.value = (latestVersion?.status || '') as PluginAuditStatus | ''

    if (latestVersion) {
      model.value.id = plugin.id
      model.value.name = latestContent.name || plugin.name
      model.value.description = latestContent.description || plugin.description
      model.value.icon = latestContent.icon || (plugin as any).icon
      model.value.version = latestVersion.version
      model.value.author = getPluginAuthorName(latestContent.author, '')
      model.value.script = typeof latestContent.script === 'string' ? latestContent.script : ''
      configScripts.value = extractConfigScripts(latestContent)
      model.value.content = JSON.stringify(latestContent, null, 2)
      model.value.changelog = latestVersion.changelog || ''
    }
  } catch {
    message.error(t('dashboard.loadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!authStore.token) {
    message.warning(t('submit.loginFirst'))
    router.push('/plugins')
    return
  }

  if (route.query.edit) {
    await fetchPluginData(route.query.edit as string)
  }
})

const autoFill = () => {
  if (!parsedContentState.value.content) {
    message.error(t('submit.invalidJson'))
    return
  }

  const contentJson = parsedContentState.value.content

  if (typeof contentJson.id === 'string') model.value.id = contentJson.id
  if (typeof contentJson.name === 'string') model.value.name = contentJson.name
  if (typeof contentJson.version === 'string') model.value.version = contentJson.version
  if (typeof contentJson.description === 'string') model.value.description = contentJson.description
  if (typeof contentJson.icon === 'string') model.value.icon = contentJson.icon
  if (contentJson.author !== undefined) model.value.author = getPluginAuthorName(contentJson.author, '')
  if (typeof contentJson.script === 'string') model.value.script = contentJson.script
  configScripts.value = extractConfigScripts(contentJson)

  message.success(t('submit.autoFillSuccess'))
}

const submit = async (e: MouseEvent) => {
  e.preventDefault()
  if (loading.value) return

  try {
    await (formRef.value as { validate?: () => Promise<void> } | null)?.validate?.()

    if (!parsedContentState.value.content) {
      throw new SyntaxError('Invalid JSON content')
    }

    const contentJson = JSON.parse(JSON.stringify(parsedContentState.value.content)) as JsonRecord
    contentJson.id = model.value.id
    contentJson.name = model.value.name
    contentJson.version = model.value.version
    contentJson.description = model.value.description
    contentJson.icon = model.value.icon
    if (model.value.author) contentJson.author = model.value.author
    contentJson.script = model.value.script
    applyConfigScriptsToContent(contentJson, configScripts.value)

    const validation = validatePluginContent(contentJson)
    if (!validation.valid || !validation.content) {
      message.error(validation.errors[0] || t('submit.invalidJson'))
      return
    }

    if (
      isEditMode.value &&
      latestVersionStatusInEditMode.value === 'REJECTED' &&
      latestVersionInEditMode.value &&
      model.value.version.trim() === latestVersionInEditMode.value
    ) {
      message.error(t('submit.rejectedNeedNewVersion'))
      return
    }

    loading.value = true

    await createPlugin({
      ...model.value,
      content: validation.content
    })

    message.success(t('submit.success'))
    router.push('/plugins')
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      message.error(t('submit.invalidJson'))
      return
    }

    const responseData = (error as { response?: { data?: { code?: string; message?: string | string[] } } })?.response?.data
    const responseCode = responseData?.code
    const responseMessage = responseData?.message

    if (responseCode === 'PLUGIN_VERSION_REJECTED_RESUBMIT_REQUIRES_NEW_VERSION') {
      message.error(t('submit.rejectedNeedNewVersion'))
      return
    }

    if (responseCode === 'PLUGIN_VERSION_ALREADY_EXISTS') {
      message.error(t('submit.versionExistsNeedBump'))
      return
    }

    const normalizedMessage = Array.isArray(responseMessage) ? responseMessage.join(', ') : responseMessage
    message.error(normalizedMessage || 'Submission failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pt-25 pb-20 container-custom min-h-screen xl:max-w-[1366px] mx-auto">
    <div class="flex justify-between items-center mb-6 px-4 xl:px-0">
      <h1 class="text-2xl font-bold text-gray-800">{{ t('submit.title') }}</h1>
      <NButton type="primary" :loading="loading" @click="submit" size="large" class="shadow-sm">
        <template #icon>
          <div class="i-ph-paper-plane-tilt" />
        </template>
        {{ t('submit.submitBtn') }}
      </NButton>
    </div>

    <NForm ref="formRef" :model="model" :rules="rules">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-2 px-4 xl:px-0">

        <!-- Left Column: Primary Content (Editor & Metadata) -->
        <div class="lg:col-span-5 flex flex-col gap-2">

          <!-- 1. JSON Configuration -->
          <NCard size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-file-code text-blue-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.jsonLabel') }}</span>
              </div>
            </template>
            <template #header-extra>
              <NButton size="small" type="primary" ghost @click="autoFill">
                <template #icon>
                  <div class="i-ph-magic-wand" />
                </template>
                {{ t('submit.autoFill') }}
              </NButton>
            </template>
            <NFormItem path="content" :show-label="false" class="!mb-0">
              <NInput v-model:value="model.content" type="textarea" :rows="16"
                :placeholder="t('submit.jsonPlaceholder')" class="font-mono text-sm" />
            </NFormItem>
          </NCard>


          <NCard size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-info text-gray-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.basicInfo') }}</span>
              </div>
            </template>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <NFormItem :label="t('submit.id')" path="id">
                <NInput v-model:value="model.id" :placeholder="t('submit.idPlaceholder')" :disabled="isEditMode" />
              </NFormItem>
              <NFormItem :label="t('submit.name')" path="name">
                <NInput v-model:value="model.name" :placeholder="t('submit.namePlaceholder')" />
              </NFormItem>
              <NFormItem :label="t('submit.version')" path="version">
                <NInput v-model:value="model.version" :placeholder="t('submit.versionPlaceholder')" />
              </NFormItem>
              <NFormItem :label="t('submit.author')" path="author">
                <NInput v-model:value="model.author" :placeholder="t('submit.authorPlaceholder')" />
              </NFormItem>
              <NFormItem :label="t('submit.icon')" path="icon" class="sm:col-span-2">
                <NInput v-model:value="model.icon" :placeholder="t('submit.iconPlaceholder')" />
              </NFormItem>
            </div>

            <NFormItem :label="t('submit.desc')" path="description">
              <NInput v-model:value="model.description" type="textarea" :placeholder="t('submit.descPlaceholder')" />
            </NFormItem>

            <NFormItem :label="t('submit.changelog')" path="changelog" class="!mb-0">
              <NInput v-model:value="model.changelog" type="textarea" :placeholder="t('submit.changelogPlaceholder')" />
            </NFormItem>
          </NCard>
          <!-- 2. Upload Script -->
          <NCard size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-file-js text-yellow-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.script') }}</span>
              </div>
            </template>
            <NFormItem path="script" :show-label="false" class="!mb-0">
              <ScriptCodeEditor v-model="model.script" class="w-full resize-y"
                :placeholder="t('submit.scriptPlaceholder')" />
            </NFormItem>
          </NCard>
          <NCard size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-function text-emerald-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.configScripts') }}</span>
              </div>
            </template>
            <template #header-extra>
              <span class="text-xs text-gray-500">inputs[].dataSource.script</span>
            </template>
            <div v-if="configScripts.length" class="flex flex-col gap-4">
              <NFormItem v-for="item in configScripts" :key="item.key"
                :label="item.inputLabel ? `${item.inputLabel} (${item.inputName})` : item.inputName" class="!mb-0">
                <ScriptCodeEditor v-model="item.script" class="w-full resize-y"
                  :placeholder="t('submit.configScriptPlaceholder')" />
              </NFormItem>
            </div>
            <NAlert v-else type="info">
              {{ t('submit.noConfigScripts') }}
            </NAlert>
          </NCard>




        </div>

        <!-- Right Column: Secondary Support (Live Preview & Testing Sandbox) -->
        <div class="lg:col-span-7 flex flex-col gap-2">
          <SubmitTestAndPreview :parsed-content-state="parsedContentState" />
        </div>

      </div>
    </NForm>
  </div>
</template>











