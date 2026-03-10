<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NAlert,
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
  NInputNumber,
  NSelect,
  useMessage,
} from 'naive-ui'
import {
  fetchAdminCaptchaConfig,
  fetchAdminMailConfig,
  testAdminMailConfig,
  updateAdminCaptchaConfig,
  updateAdminMailConfig,
} from '@common/api'
import type {
  AdminCaptchaConfig,
  AdminMailProvider,
  UpdateAdminCaptchaConfigPayload,
  UpdateAdminMailConfigPayload,
} from '@common/types'

const { t } = useI18n()
const message = useMessage()

const loading = ref(false)
const savingMail = ref(false)
const testingMail = ref(false)
const savingCaptcha = ref(false)

const mailForm = reactive({
  provider: 'SMTP' as AdminMailProvider,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  fromEmail: '',
  fromName: '',
  enabled: false,
  smtpPassConfigured: false,
  testToEmail: '',
})

const captchaForm = reactive<{
  provider: AdminCaptchaConfig['provider']
  siteKey: string
  secret: string
  enabled: boolean
  registerEnabled: boolean
  loginEnabled: boolean
  scoreThreshold: number
  secretConfigured: boolean
}>({
  provider: 'TURNSTILE',
  siteKey: '',
  secret: '',
  enabled: false,
  registerEnabled: true,
  loginEnabled: false,
  scoreThreshold: 0.5,
  secretConfigured: false,
})

const mailProviderOptions = computed(() => [
  {
    label: t('admin.settings.mailProviderSmtpLabel'),
    value: 'SMTP',
  },
])

const captchaProviderOptions = computed(() => [
  {
    label: t('admin.settings.captchaProviderTurnstileLabel'),
    value: 'TURNSTILE',
  },
  {
    label: t('admin.settings.captchaProviderRecaptchaLabel'),
    value: 'RECAPTCHA',
  },
])

const resolveErrorMessage = (error: unknown, fallback: string) => {
  const messageValue = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
  if (Array.isArray(messageValue)) {
    return messageValue.join(' ')
  }

  if (typeof messageValue === 'string' && messageValue.trim()) {
    return messageValue
  }

  return fallback
}

const loadSettings = async () => {
  loading.value = true
  try {
    const [mailRes, captchaRes] = await Promise.all([
      fetchAdminMailConfig(),
      fetchAdminCaptchaConfig(),
    ])

    const mail = mailRes.data
    const captcha = captchaRes.data

    mailForm.provider = mail.provider
    mailForm.smtpHost = mail.smtpHost || ''
    mailForm.smtpPort = mail.smtpPort || 587
    mailForm.smtpSecure = Boolean(mail.smtpSecure)
    mailForm.smtpUser = mail.smtpUser || ''
    mailForm.smtpPass = ''
    mailForm.fromEmail = mail.fromEmail || ''
    mailForm.fromName = mail.fromName || ''
    mailForm.enabled = Boolean(mail.enabled)
    mailForm.smtpPassConfigured = Boolean(mail.smtpPassConfigured)

    captchaForm.provider = captcha.provider
    captchaForm.siteKey = captcha.siteKey || ''
    captchaForm.secret = ''
    captchaForm.enabled = Boolean(captcha.enabled)
    captchaForm.registerEnabled = Boolean(captcha.registerEnabled)
    captchaForm.loginEnabled = Boolean(captcha.loginEnabled)
    captchaForm.scoreThreshold = Number(captcha.scoreThreshold || 0.5)
    captchaForm.secretConfigured = Boolean(captcha.secretConfigured)
  } catch (error) {
    console.error('Failed to load system settings', error)
    message.error(resolveErrorMessage(error, t('admin.settings.loadFailed')))
  } finally {
    loading.value = false
  }
}

const saveMailConfig = async () => {
  savingMail.value = true
  try {
    const payload: UpdateAdminMailConfigPayload = {
      provider: mailForm.provider,
      smtpHost: mailForm.smtpHost,
      smtpPort: Number(mailForm.smtpPort),
      smtpSecure: mailForm.smtpSecure,
      smtpUser: mailForm.smtpUser,
      fromEmail: mailForm.fromEmail,
      fromName: mailForm.fromName,
      enabled: mailForm.enabled,
      clearSmtpPass: false,
    }

    if (mailForm.smtpPass.trim()) {
      payload.smtpPass = mailForm.smtpPass.trim()
    }

    const response = await updateAdminMailConfig(payload)
    mailForm.smtpPass = ''
    mailForm.smtpPassConfigured = Boolean(response.data.smtpPassConfigured)
    message.success(t('admin.settings.mailSaved'))
  } catch (error) {
    console.error('Save mail config failed', error)
    message.error(resolveErrorMessage(error, t('admin.settings.mailSaveFailed')))
  } finally {
    savingMail.value = false
  }
}

const testMail = async () => {
  if (!mailForm.testToEmail.trim()) {
    message.warning(t('admin.settings.testEmailRequired'))
    return
  }

  testingMail.value = true
  try {
    const response = await testAdminMailConfig(mailForm.testToEmail.trim())
    if (response.data.success) {
      message.success(
        t('admin.settings.testMailSuccess', {
          messageId: response.data.messageId || '-',
        }),
      )
    } else {
      message.error(
        t('admin.settings.testMailFailed', {
          reason: response.data.errorMessage || response.data.errorCode || '-',
        }),
      )
    }
  } catch (error) {
    console.error('Test mail failed', error)
    message.error(resolveErrorMessage(error, t('admin.settings.testMailFailed', { reason: '-' })))
  } finally {
    testingMail.value = false
  }
}

const saveCaptchaConfig = async () => {
  savingCaptcha.value = true
  try {
    const payload: UpdateAdminCaptchaConfigPayload = {
      provider: captchaForm.provider,
      siteKey: captchaForm.siteKey,
      enabled: captchaForm.enabled,
      registerEnabled: captchaForm.registerEnabled,
      loginEnabled: captchaForm.loginEnabled,
      scoreThreshold: Number(captchaForm.scoreThreshold),
      clearSecret: false,
    }

    if (captchaForm.secret.trim()) {
      payload.secret = captchaForm.secret.trim()
    }

    const response = await updateAdminCaptchaConfig(payload)
    captchaForm.secret = ''
    captchaForm.secretConfigured = Boolean(response.data.secretConfigured)
    message.success(t('admin.settings.captchaSaved'))
  } catch (error) {
    console.error('Save captcha config failed', error)
    message.error(resolveErrorMessage(error, t('admin.settings.captchaSaveFailed')))
  } finally {
    savingCaptcha.value = false
  }
}

onMounted(() => {
  void loadSettings()
})
</script>

<template>
  <div class="p-6">
    <NCard :title="t('admin.settings.title')" :bordered="false" class="shadow-sm rounded-2xl">
      <template #header-extra>
        <NButton tertiary :loading="loading" @click="loadSettings">
          {{ t('admin.settings.refresh') }}
        </NButton>
      </template>

      <NAlert type="info" class="mb-5">
        {{ t('admin.settings.notice') }}
      </NAlert>

      <NTabs type="line" animated>
        <NTabPane name="mail" :tab="t('admin.settings.mailTab')">
          <NForm label-placement="top" class="mt-4">
            <NSpace vertical :size="12">
              <NFormItem :label="t('admin.settings.mailProvider')">
                <NSelect v-model:value="mailForm.provider" :options="mailProviderOptions" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.smtpHost')">
                <NInput v-model:value="mailForm.smtpHost" :placeholder="t('admin.settings.smtpHostPlaceholder')" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.smtpPort')">
                <NInputNumber v-model:value="mailForm.smtpPort" :min="1" :max="65535" class="w-full" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.smtpSecure')">
                <NSwitch v-model:value="mailForm.smtpSecure" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.smtpUser')">
                <NInput v-model:value="mailForm.smtpUser" :placeholder="t('admin.settings.smtpUserPlaceholder')" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.smtpPass')">
                <NInput
                  v-model:value="mailForm.smtpPass"
                  type="password"
                  show-password-on="click"
                  :placeholder="mailForm.smtpPassConfigured ? t('admin.settings.keepSecretTip') : t('admin.settings.secretPlaceholder')"
                />
              </NFormItem>

              <NFormItem :label="t('admin.settings.fromEmail')">
                <NInput v-model:value="mailForm.fromEmail" :placeholder="t('admin.settings.fromEmailPlaceholder')" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.fromName')">
                <NInput v-model:value="mailForm.fromName" :placeholder="t('admin.settings.fromNamePlaceholder')" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.enableMail')">
                <NSwitch v-model:value="mailForm.enabled" />
              </NFormItem>

              <NSpace>
                <NButton type="primary" :loading="savingMail" @click="saveMailConfig">
                  {{ t('admin.settings.saveMail') }}
                </NButton>
              </NSpace>

              <NFormItem :label="t('admin.settings.testEmailTo')">
                <NInput v-model:value="mailForm.testToEmail" :placeholder="t('admin.settings.testEmailPlaceholder')" />
              </NFormItem>

              <NButton secondary :loading="testingMail" @click="testMail">
                {{ t('admin.settings.testMail') }}
              </NButton>
            </NSpace>
          </NForm>
        </NTabPane>

        <NTabPane name="captcha" :tab="t('admin.settings.captchaTab')">
          <NForm label-placement="top" class="mt-4">
            <NSpace vertical :size="12">
              <NFormItem :label="t('admin.settings.captchaProvider')">
                <NSelect v-model:value="captchaForm.provider" :options="captchaProviderOptions" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.captchaSiteKey')">
                <NInput v-model:value="captchaForm.siteKey" :placeholder="t('admin.settings.captchaSiteKeyPlaceholder')" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.captchaSecret')">
                <NInput
                  v-model:value="captchaForm.secret"
                  type="password"
                  show-password-on="click"
                  :placeholder="captchaForm.secretConfigured ? t('admin.settings.keepSecretTip') : t('admin.settings.secretPlaceholder')"
                />
              </NFormItem>

              <NFormItem :label="t('admin.settings.enableCaptcha')">
                <NSwitch v-model:value="captchaForm.enabled" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.captchaOnRegister')">
                <NSwitch v-model:value="captchaForm.registerEnabled" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.captchaOnLogin')">
                <NSwitch v-model:value="captchaForm.loginEnabled" />
              </NFormItem>

              <NFormItem :label="t('admin.settings.scoreThreshold')">
                <NInputNumber
                  v-model:value="captchaForm.scoreThreshold"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  class="w-full"
                />
              </NFormItem>

              <NButton type="primary" :loading="savingCaptcha" @click="saveCaptchaConfig">
                {{ t('admin.settings.saveCaptcha') }}
              </NButton>
            </NSpace>
          </NForm>
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
</template>

