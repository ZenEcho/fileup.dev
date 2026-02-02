
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  NForm, NFormItem, NInput, NButton, useMessage, NCard,
  NSelect, NSwitch, NDivider
} from 'naive-ui'
import { useAuthStore } from '../stores/auth'
import api from '../api'

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

// Watch form fields to update JSON content
watch(
  () => [model.value.id, model.value.name, model.value.description, model.value.icon, model.value.version, model.value.author, model.value.script],
  () => {
    if (isSyncing.value) return
    
    try {
      const content = model.value.content ? JSON.parse(model.value.content) : {}
      let changed = false
      
      if (model.value.id && content.id !== model.value.id) { content.id = model.value.id; changed = true }
      if (model.value.name && content.name !== model.value.name) { content.name = model.value.name; changed = true }
      if (model.value.version && content.version !== model.value.version) { content.version = model.value.version; changed = true }
      if (model.value.description && content.description !== model.value.description) { content.description = model.value.description; changed = true }
      if (model.value.icon && content.icon !== model.value.icon) { content.icon = model.value.icon; changed = true }
      if (model.value.author && content.author !== model.value.author) { content.author = model.value.author; changed = true }
      if (model.value.script && content.script !== model.value.script) { content.script = model.value.script; changed = true }
      
      if (changed) {
        isSyncing.value = true
        model.value.content = JSON.stringify(content, null, 2)
        // Reset flag after next tick to allow other watchers to fire safely if needed, 
        // but mostly to prevent the content watcher from re-triggering form updates immediately
        setTimeout(() => { isSyncing.value = false }, 0)
      }
    } catch (e) {
      // Ignore JSON parse errors while typing in form
    }
  }
)

// Watch JSON content to update form fields (Reverse sync)
watch(
  () => model.value.content,
  (newVal) => {
    if (isSyncing.value) return
    
    try {
      const content = JSON.parse(newVal)
      isSyncing.value = true
      
      if (content.id) model.value.id = content.id
      if (content.name) model.value.name = content.name
      if (content.version) model.value.version = content.version
      if (content.description) model.value.description = content.description
      if (content.icon) model.value.icon = content.icon
      if (content.author) model.value.author = content.author
      if (content.script) model.value.script = content.script
      
      setTimeout(() => { isSyncing.value = false }, 0)
    } catch (e) {
      // Ignore invalid JSON while typing
    }
  }
)

const previewInputs = computed(() => {
  try {
    const content = JSON.parse(model.value.content)
    return Array.isArray(content.inputs) ? content.inputs : []
  } catch (e) {
    return []
  }
})

const rules = {
  id: { required: true, message: 'ID is required', trigger: 'blur' },
  name: { required: true, message: 'Name is required', trigger: 'blur' },
  version: { required: true, message: 'Version is required', trigger: 'blur' },
  content: { required: true, message: 'Content is required', trigger: 'blur' }
}

const loading = ref(false)

const isEditMode = computed(() => !!route.query.edit)

const fetchPluginData = async (id: string) => {
  loading.value = true
  try {
    // Add allStatus=true query param to fetch latest version regardless of status
    const res = await api.get(`/plugins/${id}?allStatus=true`)
    const plugin = res.data
    const latestVersion = plugin.versions[0]
    
    if (latestVersion) {
      model.value.id = plugin.id
      model.value.name = plugin.name
      model.value.description = plugin.description
      model.value.icon = plugin.icon
      // We should probably increment version automatically or let user do it.
      // Let's keep the version as is, user must change it.
      model.value.version = latestVersion.version
      model.value.author = latestVersion.content?.author || ''
      model.value.script = latestVersion.content?.script || ''
      model.value.content = JSON.stringify(latestVersion.content, null, 2)
    }
  } catch (error) {
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
  try {
    const contentJson = JSON.parse(model.value.content)
    
    if (contentJson.id) model.value.id = contentJson.id
    if (contentJson.name) model.value.name = contentJson.name
    if (contentJson.version) model.value.version = contentJson.version
    if (contentJson.description) model.value.description = contentJson.description
    if (contentJson.icon) model.value.icon = contentJson.icon
    
    message.success(t('submit.autoFillSuccess'))
  } catch (error) {
    message.error(t('submit.invalidJson'))
  }
}

const submit = async (e: MouseEvent) => {
  e.preventDefault()
  if (loading.value) return
  
  try {
    await (formRef.value as any)?.validate()

    const contentJson = JSON.parse(model.value.content)
    
    // Auto-fill some fields from JSON if empty
    // Force overwrite author, version, description, icon from form inputs to JSON content
    // This ensures consistency between metadata and installed content
    contentJson.id = model.value.id
    contentJson.name = model.value.name
    contentJson.version = model.value.version
    contentJson.description = model.value.description
    contentJson.icon = model.value.icon
    if (model.value.author) contentJson.author = model.value.author
    if (model.value.script) contentJson.script = model.value.script
    
    // Also ensure author is set (optional, but good practice if not present)
    // Note: We don't have user's name here easily unless we fetch it, 
    // but the backend will set authorId. The JSON 'author' field is display-only.
    // If user didn't set it in JSON, we could leave it or set it to current user.
    // For now, let's trust the user's input or what they pasted.
    
    loading.value = true
    
    await api.post('/plugins', {
      ...model.value,
      content: contentJson
    })
    
    message.success(t('submit.success'))
    router.push('/plugins')
  } catch (error: any) {
    console.error(error)
    if (error instanceof SyntaxError) {
      message.error(t('submit.invalidJson'))
    } else {
      message.error(error.response?.data?.message || 'Submission failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pt-25 pb-20 container-custom min-h-screen max-w-800px mx-auto">
    <NCard :title="t('submit.title')">
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem :label="t('submit.jsonLabel')" path="content">
          <div class="w-full">
            <NInput 
              v-model:value="model.content" 
              type="textarea" 
              :rows="10" 
              :placeholder="t('submit.jsonPlaceholder')" 
            />
            <div class="mt-2 text-right">
              <NButton size="small" type="info" ghost @click="autoFill">
                <div class="i-ph-magic-wand mr-1" />
                {{ t('submit.autoFill') }}
              </NButton>
            </div>
          </div>
        </NFormItem>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <NFormItem :label="t('submit.icon')" path="icon">
            <NInput v-model:value="model.icon" :placeholder="t('submit.iconPlaceholder')" />
          </NFormItem>
        </div>
        
        <NFormItem :label="t('submit.desc')" path="description">
          <NInput v-model:value="model.description" type="textarea" :placeholder="t('submit.descPlaceholder')" />
        </NFormItem>
        
        <NFormItem :label="t('submit.script')" path="script">
          <NInput v-model:value="model.script" type="textarea" :rows="10" :placeholder="t('submit.scriptPlaceholder')" />
        </NFormItem>

        <!-- Configuration Preview Section -->
        <div v-if="previewInputs.length > 0" class="mb-6">
          <NDivider>{{ t('submit.configPreview') }}</NDivider>
          <div class="bg-gray-50/50 p-6 rounded-xl border border-gray-200">
            <div v-for="(input, index) in previewInputs" :key="index" class="mb-4 last:mb-0">
              <div class="mb-1 flex items-center gap-2">
                <span class="font-medium text-gray-700">{{ input.label || input.name }}</span>
                <span v-if="input.required" class="text-red-500">*</span>
                <span v-if="input.type === 'password'" class="text-xs bg-gray-200 px-1 rounded text-gray-500">Secret</span>
              </div>
              
              <!-- Text / Password Input -->
              <NInput 
                v-if="!input.type || input.type === 'text' || input.type === 'password'" 
                :type="input.type === 'password' ? 'password' : 'text'"
                :placeholder="input.placeholder || input.help" 
                :default-value="input.default"
              />
              
              <!-- Select Input -->
              <NSelect 
                v-else-if="input.type === 'select'"
                :options="input.options" 
                :placeholder="input.placeholder"
                :default-value="input.default"
              />
              
              <!-- Checkbox / Switch -->
              <div v-else-if="input.type === 'checkbox'" class="flex items-center">
                 <NSwitch :default-value="input.default === true" />
                 <span class="ml-2 text-sm text-gray-500">{{ input.help }}</span>
              </div>

              <div v-if="input.help && input.type !== 'checkbox'" class="mt-1 text-xs text-gray-400">
                {{ input.help }}
              </div>
            </div>
          </div>
        </div>

        <NFormItem :label="t('submit.changelog')" path="changelog">
          <NInput v-model:value="model.changelog" type="textarea" :placeholder="t('submit.changelogPlaceholder')" />
        </NFormItem>
        
        <div class="flex justify-end">
          <NButton type="primary" :loading="loading" @click="submit">
            {{ t('submit.submitBtn') }}
          </NButton>
        </div>
      </NForm>
    </NCard>
  </div>
</template>
