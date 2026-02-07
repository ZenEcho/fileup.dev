import { createI18n } from 'vue-i18n'
import zhCN from '@common/locales/zh-CN'
import en from '@common/locales/en'

const i18n = createI18n({
  legacy: false, // use Composition API
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    en
  }
})

export default i18n
