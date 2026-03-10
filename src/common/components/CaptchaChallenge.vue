<template>
  <div class="flex flex-col gap-2">
    <div ref="containerRef" class="min-h-[72px]" />

    <p v-if="loading" class="text-0.8rem text-slate-500 dark:text-slate-400">
      {{ t('auth.captchaLoading') }}
    </p>

    <NAlert v-if="loadError" type="warning" size="small">
      {{ loadError }}
    </NAlert>

    <template v-if="showManualInput">
      <NInput
        v-model:value="manualToken"
        :placeholder="t('auth.captchaPlaceholder')"
        clearable
      />
      <p class="text-0.8rem text-slate-500 dark:text-slate-400">
        {{ t('auth.captchaManualHint', { provider }) }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NAlert, NInput } from 'naive-ui'
import type { CaptchaPolicy } from '@common/api'

type CaptchaProvider = CaptchaPolicy['provider']

type ProviderScriptMap = Record<CaptchaProvider, string>

const SCRIPT_SRC: ProviderScriptMap = {
  TURNSTILE: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  RECAPTCHA: 'https://www.google.com/recaptcha/api.js?render=explicit',
}

const SCRIPT_ID: ProviderScriptMap = {
  TURNSTILE: 'fileup-captcha-script-turnstile',
  RECAPTCHA: 'fileup-captcha-script-recaptcha',
}

const scriptLoadingMap = new Map<CaptchaProvider, Promise<void>>()

const props = defineProps<{
  modelValue: string
  provider: CaptchaProvider
  siteKey: string | null
  enabled: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()
const containerRef = ref<HTMLElement | null>(null)
const widgetId = ref<string | number | null>(null)
const loading = ref(false)
const loadError = ref('')

const hasSiteKey = computed(() => {
  return Boolean(props.siteKey && props.siteKey.trim())
})

const showManualInput = computed(() => {
  return !hasSiteKey.value || Boolean(loadError.value)
})

const manualToken = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value.trim())
  },
})

const isProviderReady = (provider: CaptchaProvider) => {
  if (provider === 'TURNSTILE') {
    return Boolean(window.turnstile?.render)
  }
  return Boolean(window.grecaptcha?.render)
}

const waitForProviderReady = (provider: CaptchaProvider, timeoutMs = 10000) => {
  return new Promise<void>((resolve, reject) => {
    const startedAt = Date.now()

    const tick = () => {
      if (isProviderReady(provider)) {
        resolve()
        return
      }

      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error('Captcha script load timeout'))
        return
      }

      setTimeout(tick, 50)
    }

    tick()
  })
}

const loadCaptchaSdk = (provider: CaptchaProvider) => {
  if (isProviderReady(provider)) {
    return Promise.resolve()
  }

  const cached = scriptLoadingMap.get(provider)
  if (cached) {
    return cached
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existedScript = document.getElementById(SCRIPT_ID[provider]) as HTMLScriptElement | null
    if (existedScript) {
      void waitForProviderReady(provider).then(resolve).catch(reject)
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID[provider]
    script.src = SCRIPT_SRC[provider]
    script.async = true
    script.defer = true

    script.onload = () => {
      void waitForProviderReady(provider).then(resolve).catch(reject)
    }

    script.onerror = () => {
      reject(new Error('Captcha script failed to load'))
    }

    document.head.appendChild(script)
  })

  scriptLoadingMap.set(provider, promise)
  return promise
}

const clearWidgetContainer = () => {
  if (containerRef.value) {
    containerRef.value.innerHTML = ''
  }
  widgetId.value = null
}

const reset = () => {
  emit('update:modelValue', '')

  if (props.provider === 'TURNSTILE') {
    if (typeof widgetId.value === 'string') {
      window.turnstile?.reset(widgetId.value)
    }
    return
  }

  if (typeof widgetId.value === 'number') {
    window.grecaptcha?.reset(widgetId.value)
  }
}

const renderCaptchaWidget = async () => {
  clearWidgetContainer()
  emit('update:modelValue', '')

  if (!props.enabled) {
    loadError.value = ''
    loading.value = false
    return
  }

  if (!hasSiteKey.value) {
    loadError.value = t('auth.captchaSiteKeyMissing')
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    await loadCaptchaSdk(props.provider)
    await nextTick()

    const container = containerRef.value
    const siteKey = props.siteKey?.trim()

    if (!container || !siteKey) {
      return
    }

    if (props.provider === 'TURNSTILE') {
      widgetId.value = window.turnstile?.render(container, {
        sitekey: siteKey,
        theme: 'auto',
        callback: (token: string) => {
          emit('update:modelValue', token)
        },
        'expired-callback': () => {
          emit('update:modelValue', '')
          loadError.value = t('auth.captchaExpired')
        },
        'error-callback': () => {
          emit('update:modelValue', '')
          loadError.value = t('auth.captchaLoadFailed')
        },
      }) || null
      return
    }

    await new Promise<void>((resolve) => {
      window.grecaptcha?.ready(() => {
        widgetId.value =
          window.grecaptcha?.render(container, {
            sitekey: siteKey,
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            callback: (token: string) => {
              emit('update:modelValue', token)
            },
            'expired-callback': () => {
              emit('update:modelValue', '')
              loadError.value = t('auth.captchaExpired')
            },
            'error-callback': () => {
              emit('update:modelValue', '')
              loadError.value = t('auth.captchaLoadFailed')
            },
          }) || null

        resolve()
      })
    })
  } catch (error) {
    console.error('Captcha widget init failed', error)
    loadError.value = t('auth.captchaLoadFailed')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.enabled, props.provider, props.siteKey],
  () => {
    void renderCaptchaWidget()
  },
)

onMounted(() => {
  void renderCaptchaWidget()
})

defineExpose({
  reset,
})
</script>
