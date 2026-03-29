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
  NSelect,
  useMessage,
} from 'naive-ui'
import { useAuthStore } from '@common/stores/auth'
import { createPlugin, fetchPluginDetail } from '@common/api'
import { ScriptCodeEditor } from '@common/ui'
import { SubmitTestAndPreview } from '@frontend/sections/submit'
import { getPluginAuthorName, validatePluginContent, type PluginKind } from '@common/utils/plugin'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()
const { t } = useI18n()

const formRef = ref(null)
const model = ref({
  id: '',
  kind: 'uploader' as PluginKind,
  name: '',
  description: '',
  icon: '',
  version: '1.0.0',
  author: '',
  targetDriveType: '',
  editorType: '',
  displayName: '',
  script: '',
  detectScript: '',
  extractScript: '',
  injectScript: '',
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
const hasOwnKey = (record: JsonRecord, key: string) => Object.prototype.hasOwnProperty.call(record, key)

const getUploaderSection = (content: unknown): JsonRecord | null => {
  if (!isRecord(content)) return null

  if (isRecord(content.uploader)) {
    return content.uploader
  }

  const hasLegacy = hasOwnKey(content, 'inputs') || hasOwnKey(content, 'script')
  if (!hasLegacy) {
    return null
  }

  return {
    inputs: Array.isArray(content.inputs) ? content.inputs : [],
    script: typeof content.script === 'string' ? content.script : '',
  }
}

const ensureUploaderSection = (content: JsonRecord): JsonRecord => {
  const current = isRecord(content.uploader) ? content.uploader : {}
  const uploader: JsonRecord = { ...current }

  if (!Array.isArray(uploader.inputs)) {
    uploader.inputs = Array.isArray(content.inputs) ? content.inputs : []
  }

  if (typeof uploader.script !== 'string') {
    uploader.script = typeof content.script === 'string' ? content.script : ''
  }

  content.uploader = uploader
  delete content.inputs
  delete content.script

  return uploader
}

const getDetectorSection = (content: unknown): JsonRecord | null => {
  if (!isRecord(content)) return null

  if (isRecord(content.detector)) {
    return content.detector
  }

  const hasLegacy =
    hasOwnKey(content, 'targetDriveType') ||
    hasOwnKey(content, 'detectScript') ||
    hasOwnKey(content, 'extractScript') ||
    hasOwnKey(content, 'match') ||
    hasOwnKey(content, 'presentation') ||
    hasOwnKey(content, 'priority') ||
    hasOwnKey(content, 'actionForm')

  if (!hasLegacy) {
    return null
  }

  const detector: JsonRecord = {
    targetDriveType: typeof content.targetDriveType === 'string' ? content.targetDriveType : '',
    detectScript: typeof content.detectScript === 'string' ? content.detectScript : '',
    extractScript: typeof content.extractScript === 'string' ? content.extractScript : '',
  }

  if (content.match !== undefined) detector.match = content.match
  if (content.presentation !== undefined) detector.presentation = content.presentation
  if (content.priority !== undefined) detector.priority = content.priority
  if (content.actionForm !== undefined) detector.actionForm = content.actionForm

  return detector
}

const ensureDetectorSection = (content: JsonRecord): JsonRecord => {
  const current = isRecord(content.detector) ? content.detector : {}
  const detector: JsonRecord = { ...current }

  if (typeof detector.targetDriveType !== 'string') {
    detector.targetDriveType = typeof content.targetDriveType === 'string' ? content.targetDriveType : ''
  }
  if (typeof detector.detectScript !== 'string') {
    detector.detectScript = typeof content.detectScript === 'string' ? content.detectScript : ''
  }
  if (typeof detector.extractScript !== 'string') {
    detector.extractScript = typeof content.extractScript === 'string' ? content.extractScript : ''
  }

  if (!hasOwnKey(detector, 'match') && content.match !== undefined) detector.match = content.match
  if (!hasOwnKey(detector, 'presentation') && content.presentation !== undefined) detector.presentation = content.presentation
  if (!hasOwnKey(detector, 'priority') && content.priority !== undefined) detector.priority = content.priority
  if (!hasOwnKey(detector, 'actionForm') && content.actionForm !== undefined) detector.actionForm = content.actionForm

  content.detector = detector
  delete content.targetDriveType
  delete content.detectScript
  delete content.extractScript
  delete content.match
  delete content.presentation
  delete content.priority
  delete content.actionForm

  return detector
}

const getEditorAdapterSection = (content: unknown): JsonRecord | null => {
  if (!isRecord(content)) return null

  if (isRecord(content.editorAdapter)) {
    return content.editorAdapter
  }

  const hasLegacy =
    hasOwnKey(content, 'editorType') ||
    hasOwnKey(content, 'displayName') ||
    hasOwnKey(content, 'detectScript') ||
    hasOwnKey(content, 'injectScript')

  if (!hasLegacy) {
    return null
  }

  return {
    editorType: typeof content.editorType === 'string' ? content.editorType : '',
    displayName: typeof content.displayName === 'string' ? content.displayName : '',
    detectScript: typeof content.detectScript === 'string' ? content.detectScript : '',
    injectScript: typeof content.injectScript === 'string' ? content.injectScript : '',
  }
}

const ensureEditorAdapterSection = (content: JsonRecord): JsonRecord => {
  const current = isRecord(content.editorAdapter) ? content.editorAdapter : {}
  const editorAdapter: JsonRecord = { ...current }

  if (typeof editorAdapter.editorType !== 'string') {
    editorAdapter.editorType = typeof content.editorType === 'string' ? content.editorType : ''
  }
  if (typeof editorAdapter.displayName !== 'string') {
    editorAdapter.displayName = typeof content.displayName === 'string' ? content.displayName : ''
  }
  if (typeof editorAdapter.detectScript !== 'string') {
    editorAdapter.detectScript = typeof content.detectScript === 'string' ? content.detectScript : ''
  }
  if (typeof editorAdapter.injectScript !== 'string') {
    editorAdapter.injectScript = typeof content.injectScript === 'string' ? content.injectScript : ''
  }

  content.editorAdapter = editorAdapter
  delete content.editorType
  delete content.displayName
  delete content.detectScript
  delete content.injectScript

  return editorAdapter
}

const extractConfigScripts = (content: unknown): ConfigScriptEditor[] => {
  const uploader = getUploaderSection(content)
  if (!uploader || !Array.isArray(uploader.inputs)) {
    return []
  }

  return uploader.inputs.flatMap((input, inputIndex) => {
    if (!isRecord(input) || !isRecord(input.dataSource)) {
      return []
    }

    const inputName = typeof input.name === 'string' && input.name.trim() ? input.name : `uploader.inputs[${inputIndex}]`
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
  const uploader = ensureUploaderSection(content)
  if (!Array.isArray(uploader.inputs)) {
    return false
  }

  let changed = false

  for (const editor of editors) {
    const input = uploader.inputs[editor.inputIndex]
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

const syncModelFromContent = (content: JsonRecord) => {
  if (typeof content.id === 'string') model.value.id = content.id
  if (typeof content.name === 'string') model.value.name = content.name
  if (typeof content.version === 'string') model.value.version = content.version
  if (typeof content.description === 'string') model.value.description = content.description
  if (typeof content.icon === 'string') model.value.icon = content.icon
  model.value.kind = content.kind === 'site-detector'
    ? 'site-detector'
    : content.kind === 'editor-adapter'
      ? 'editor-adapter'
      : 'uploader'
  model.value.author = content.author !== undefined ? getPluginAuthorName(content.author, '') : ''

  const uploader = getUploaderSection(content)
  const detector = getDetectorSection(content)
  const editorAdapter = getEditorAdapterSection(content)

  model.value.script = uploader && typeof uploader.script === 'string' ? uploader.script : ''
  model.value.targetDriveType = detector && typeof detector.targetDriveType === 'string' ? detector.targetDriveType : ''
  model.value.editorType = editorAdapter && typeof editorAdapter.editorType === 'string' ? editorAdapter.editorType : ''
  model.value.displayName = editorAdapter && typeof editorAdapter.displayName === 'string' ? editorAdapter.displayName : ''
  model.value.detectScript = model.value.kind === 'site-detector'
    ? detector && typeof detector.detectScript === 'string'
      ? detector.detectScript
      : ''
    : model.value.kind === 'editor-adapter'
      ? editorAdapter && typeof editorAdapter.detectScript === 'string'
        ? editorAdapter.detectScript
        : ''
      : ''
  model.value.extractScript = detector && typeof detector.extractScript === 'string' ? detector.extractScript : ''
  model.value.injectScript = editorAdapter && typeof editorAdapter.injectScript === 'string' ? editorAdapter.injectScript : ''
  configScripts.value = model.value.kind === 'uploader' ? extractConfigScripts(content) : []
}

const isEditMode = computed(() => !!route.query.edit)
const latestVersionStatusInEditMode = ref('')
const latestRejectReasonInEditMode = ref('')
const configScriptSignature = computed(() => configScripts.value.map((item) => `${item.key}:${item.script}`).join('||'))
const detectorScriptSignature = computed(() => `${model.value.detectScript}::${model.value.extractScript}`)
const isUploaderKind = computed(() => model.value.kind === 'uploader')
const isSiteDetectorKind = computed(() => model.value.kind === 'site-detector')
const isEditorAdapterKind = computed(() => model.value.kind === 'editor-adapter')
const isReviewRejectedLike = (status?: string) => status === 'REJECTED' || status === 'CHANGES_REQUIRED'

const pluginKindOptions = computed(() => [
  { label: t('submit.kindUploader'), value: 'uploader' },
  { label: t('submit.kindSiteDetector'), value: 'site-detector' },
  { label: t('submit.kindEditorAdapter'), value: 'editor-adapter' },
])

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
  () => [
    model.value.id,
    model.value.kind,
    model.value.name,
    model.value.description,
    model.value.icon,
    model.value.version,
    model.value.author,
    model.value.targetDriveType,
    model.value.editorType,
    model.value.displayName,
    model.value.script,
    detectorScriptSignature.value,
    model.value.injectScript,
    configScriptSignature.value,
  ],
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
      if (model.value.kind && content.kind !== model.value.kind) { content.kind = model.value.kind; changed = true }

      const currentAuthor = getPluginAuthorName(content.author, '')
      if (model.value.author && currentAuthor !== model.value.author) {
        content.author = model.value.author
        changed = true
      }

      if (model.value.kind === 'uploader') {
        const uploader = ensureUploaderSection(content)

        if (uploader.script !== model.value.script) {
          uploader.script = model.value.script
          changed = true
        }

        if (applyConfigScriptsToContent(content, configScripts.value)) {
          changed = true
        }
      } else if (model.value.kind === 'site-detector') {
        const detector = ensureDetectorSection(content)

        if (detector.targetDriveType !== model.value.targetDriveType) {
          detector.targetDriveType = model.value.targetDriveType
          changed = true
        }

        if (detector.detectScript !== model.value.detectScript) {
          detector.detectScript = model.value.detectScript
          changed = true
        }

        if (detector.extractScript !== model.value.extractScript) {
          detector.extractScript = model.value.extractScript
          changed = true
        }
      } else {
        const editorAdapter = ensureEditorAdapterSection(content)

        if (editorAdapter.editorType !== model.value.editorType) {
          editorAdapter.editorType = model.value.editorType
          changed = true
        }

        if (editorAdapter.displayName !== model.value.displayName) {
          editorAdapter.displayName = model.value.displayName
          changed = true
        }

        if (editorAdapter.detectScript !== model.value.detectScript) {
          editorAdapter.detectScript = model.value.detectScript
          changed = true
        }

        if (editorAdapter.injectScript !== model.value.injectScript) {
          editorAdapter.injectScript = model.value.injectScript
          changed = true
        }
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
      syncModelFromContent(content)

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
    latestVersionStatusInEditMode.value = latestVersion?.status || ''
    latestRejectReasonInEditMode.value
      = isReviewRejectedLike(latestVersion?.status)
        ? latestVersion?.auditLog?.trim() || ''
        : ''

    if (latestVersion) {
      model.value.id = plugin.id
      model.value.version = latestVersion.version
      syncModelFromContent(latestContent)
      model.value.name = model.value.name || plugin.name
      model.value.description = model.value.description || plugin.description
      model.value.icon = model.value.icon || (plugin as any).icon
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

  syncModelFromContent(contentJson)

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
    contentJson.kind = model.value.kind
    if (model.value.author) contentJson.author = model.value.author

    if (model.value.kind === 'uploader') {
      const uploader = ensureUploaderSection(contentJson)
      uploader.script = model.value.script
      applyConfigScriptsToContent(contentJson, configScripts.value)
    } else if (model.value.kind === 'site-detector') {
      const detector = ensureDetectorSection(contentJson)
      detector.targetDriveType = model.value.targetDriveType
      detector.detectScript = model.value.detectScript
      detector.extractScript = model.value.extractScript
    } else {
      const editorAdapter = ensureEditorAdapterSection(contentJson)
      editorAdapter.editorType = model.value.editorType
      editorAdapter.displayName = model.value.displayName
      editorAdapter.detectScript = model.value.detectScript
      editorAdapter.injectScript = model.value.injectScript
    }

    const validation = validatePluginContent(contentJson)
    if (!validation.valid || !validation.content) {
      message.error(validation.errors[0] || t('submit.invalidJson'))
      return
    }

    loading.value = true

    await createPlugin({
      id: model.value.id,
      kind: model.value.kind,
      name: model.value.name,
      description: model.value.description,
      icon: model.value.icon,
      version: model.value.version,
      author: model.value.author || undefined,
      script: model.value.kind === 'uploader' ? model.value.script : undefined,
      targetDriveType: model.value.kind === 'site-detector' ? model.value.targetDriveType : undefined,
      editorType: model.value.kind === 'editor-adapter' ? model.value.editorType : undefined,
      displayName: model.value.kind === 'editor-adapter' ? model.value.displayName : undefined,
      detectScript: model.value.kind !== 'uploader' ? model.value.detectScript : undefined,
      extractScript: model.value.kind === 'site-detector' ? model.value.extractScript : undefined,
      injectScript: model.value.kind === 'editor-adapter' ? model.value.injectScript : undefined,
      content: validation.content,
      changelog: model.value.changelog || undefined,
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
    <NAlert
      v-if="isEditMode && isReviewRejectedLike(latestVersionStatusInEditMode)"
      type="warning"
      class="mb-4 mx-4 xl:mx-0"
      :title="t('submit.lastReviewRejectedTitle')"
    >
      {{ t('submit.lastReviewRejectedReason', { reason: latestRejectReasonInEditMode || t('submit.lastReviewRejectedNoReason') }) }}
    </NAlert>

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
              <NFormItem :label="t('submit.kind')" path="kind">
                <NSelect v-model:value="model.kind" :options="pluginKindOptions" />
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
              <NFormItem v-if="isSiteDetectorKind" :label="t('submit.targetDriveType')" path="targetDriveType">
                <NInput v-model:value="model.targetDriveType" :placeholder="t('submit.targetDriveTypePlaceholder')" />
              </NFormItem>
              <NFormItem v-if="isEditorAdapterKind" :label="t('submit.editorType')" path="editorType">
                <NInput v-model:value="model.editorType" :placeholder="t('submit.editorTypePlaceholder')" />
              </NFormItem>
              <NFormItem v-if="isEditorAdapterKind" :label="t('submit.displayName')" path="displayName">
                <NInput v-model:value="model.displayName" :placeholder="t('submit.displayNamePlaceholder')" />
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
          <!-- 2. Uploader Scripts -->
          <NCard v-if="isUploaderKind" size="small" class="shadow-sm rounded-xl">
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
          <NCard v-if="isUploaderKind" size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-function text-emerald-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.configScripts') }}</span>
              </div>
            </template>
            <template #header-extra>
              <span class="text-xs text-gray-500">uploader.inputs[].dataSource.script</span>
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

          <!-- 3. Site-Detector Scripts -->
          <NCard v-if="isSiteDetectorKind" size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-magnifying-glass text-orange-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.detectScript') }}</span>
              </div>
            </template>
            <NFormItem path="detectScript" :show-label="false" class="!mb-0">
              <ScriptCodeEditor v-model="model.detectScript" class="w-full resize-y"
                :placeholder="t('submit.detectScriptPlaceholder')" />
            </NFormItem>
          </NCard>

          <NCard v-if="isSiteDetectorKind" size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-funnel text-amber-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.extractScript') }}</span>
              </div>
            </template>
            <NFormItem path="extractScript" :show-label="false" class="!mb-0">
              <ScriptCodeEditor v-model="model.extractScript" class="w-full resize-y"
                :placeholder="t('submit.extractScriptPlaceholder')" />
            </NFormItem>
          </NCard>

          <NCard v-if="isEditorAdapterKind" size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-code text-sky-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.editorDetectScript') }}</span>
              </div>
            </template>
            <NFormItem path="detectScript" :show-label="false" class="!mb-0">
              <ScriptCodeEditor v-model="model.detectScript" class="w-full resize-y"
                :placeholder="t('submit.editorDetectScriptPlaceholder')" />
            </NFormItem>
          </NCard>

          <NCard v-if="isEditorAdapterKind" size="small" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center gap-2">
                <div class="i-ph-arrow-bend-up-right text-violet-500 text-lg"></div>
                <span class="font-semibold">{{ t('submit.injectScript') }}</span>
              </div>
            </template>
            <NFormItem path="injectScript" :show-label="false" class="!mb-0">
              <ScriptCodeEditor v-model="model.injectScript" class="w-full resize-y"
                :placeholder="t('submit.injectScriptPlaceholder')" />
            </NFormItem>
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











