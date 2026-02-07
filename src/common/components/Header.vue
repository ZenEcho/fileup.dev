
<template>
  <header class="fixed top-0 w-full bg-glass backdrop-blur-12px z-1000 border-b-1 border-border">
    <div class="container-custom flex-between h-70px">
      <nav class="flex items-center justify-between w-full">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-3 decoration-none group shrink-0">
          <img :src="logoUrl" alt="GioPic Logo" class="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-110">
          <span class="text-1.25rem md:text-1.5rem font-800 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent leading-none">
            {{ t('name') }}
          </span>
        </router-link>

        <!-- Center Nav -->
        <div class="hidden md:flex items-center gap-1 lg:gap-2 absolute left-1/2 -translate-x-1/2">
          <template v-for="link in links" :key="link.href">
            <router-link 
              v-if="link.isRoute" 
              :to="link.href" 
              class="px-4 py-2 rounded-full font-600 text-text-main text-0.95rem hover:text-primary hover:bg-primary/5 transition-all decoration-none"
              active-class="text-primary bg-primary/10"
            >
              {{ link.text }}
            </router-link>
            <a 
              v-else 
              :href="link.href" 
              class="px-4 py-2 rounded-full font-600 text-text-main text-0.95rem hover:text-primary hover:bg-primary/5 transition-all decoration-none"
            >
              {{ link.text }}
            </a>
          </template>
          
          <router-link 
            v-if="authStore.user"
            to="/dashboard"
            class="px-4 py-2 rounded-full font-600 text-text-main text-0.95rem hover:text-primary hover:bg-primary/5 transition-all decoration-none"
            active-class="text-primary bg-primary/10"
          >
            {{ t('header.console') }}
          </router-link>
        </div>

        <!-- Right Utilities -->
        <div class="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            <a href="https://github.com/ZenEcho/GioPic_Web_Extension/blob/main/README_zh-CN.md" target="_blank"
              class="font-600 text-text-main text-0.95rem hover:text-primary transition-colors decoration-none hidden lg:block">{{
                t('header.docs') }}</a>
            
            <button @click="toggleLang"
              class="border-none bg-transparent cursor-pointer font-600 text-text-main text-0.95rem hover:text-primary transition-colors flex items-center gap-1">
              <div class="i-ph-translate-bold" /> {{ locale === 'zh-CN' ? 'EN' : '中' }}
            </button>
            
            <div class="w-1px h-20px bg-border mx-1"></div>

            <template v-if="authStore.user">
               <NDropdown :options="userOptions" @select="handleUserSelect">
                <div class="flex items-center gap-2 cursor-pointer hover:bg-black/5 px-3 py-1.5 rounded-full transition-colors">
                  <NAvatar round size="small" :src="authStore.user.avatar" />
                  <span class="font-600 text-0.9rem">{{ authStore.user.username }}</span>
                </div>
               </NDropdown>
            </template>
            <template v-else>
              <NButton text class="font-600" @click="login">
                Login
              </NButton>
              <a href="https://github.com/ZenEcho/GioPic_Web_Extension" target="_blank"
                class="bg-primary hover:bg-primary-dark text-white! px-5 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all decoration-none flex items-center gap-2 font-600">
                <div class="i-ph-github-logo-fill text-1.1rem" /> 
                {{ t('header.github') }}
              </a>
            </template>
          </div>

          <!-- Mobile Menu Button -->
          <button @click="toggleMobileMenu" class="md:hidden border-none bg-transparent cursor-pointer text-text-main hover:text-primary p-2 ml-auto">
            <div v-if="isMobileMenuOpen" class="i-ph-x text-1.5rem" />
            <div v-else class="i-ph-list text-1.5rem" />
          </button>
      </nav>
      </div>

      <!-- Mobile Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="isMobileMenuOpen" class="md:hidden absolute top-70px inset-x-0 bg-white/95 backdrop-blur-md border-b border-border shadow-lg flex flex-col gap-6 z-[999] max-h-[calc(100vh-70px)] overflow-y-auto p-6">
          <template v-for="link in links" :key="link.href">
            <router-link v-if="link.isRoute" :to="link.href" @click="isMobileMenuOpen = false" class="text-1.1rem font-600 text-text-main decoration-none">
              {{ link.text }}
            </router-link>
            <a v-else :href="link.href" @click="isMobileMenuOpen = false" class="text-1.1rem font-600 text-text-main decoration-none">
              {{ link.text }}
            </a>
          </template>
          <a :href="docsLink" target="_blank"
            class="text-1.1rem font-600 text-text-main decoration-none">{{ t('header.docs') }}</a>
          
          <div class="h-1px bg-border w-full my-2"></div>
          
          <template v-if="authStore.user">
             <div class="flex items-center gap-3" @click="router.push('/plugins/submit'); isMobileMenuOpen = false">
                <NAvatar round size="small" :src="authStore.user.avatar" />
                <span class="font-600">{{ authStore.user.username }}</span>
             </div>
             <button @click="authStore.logout(); isMobileMenuOpen = false" class="text-left font-600 text-error">{{ t('auth.logout') }}</button>
          </template>
          <template v-else>
             <button @click="login" class="text-left font-600 text-primary">{{ t('auth.login') }}</button>
          </template>

          <div class="flex items-center justify-between">
            <button @click="toggleLang" class="border-none bg-transparent text-text-main font-600 text-1rem flex items-center gap-2">
              <div class="i-ph-translate-bold" /> {{ locale === 'zh-CN' ? 'English' : '中文' }}
            </button>
            
            <a href="https://github.com/ZenEcho/GioPic_Web_Extension" target="_blank"
              class="bg-dark text-white! px-4 py-2 rounded-6px decoration-none flex items-center gap-2">
              <div class="i-ph-github-logo-fill" /> GitHub
            </a>
          </div>
        </div>
      </Transition>
    </header>
  </template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NDropdown, NAvatar, NButton, useMessage } from 'naive-ui'
import logoUrl from '@common/assets/logo256.png'
import { useAuthStore } from '@common/stores/auth'
import { API_BASE_URL } from '@common/services/api'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

const docsLink = 'https://github.com/ZenEcho/GioPic_Web_Extension/blob/main/README_zh-CN.md'

const isMobileMenuOpen = ref(false)

const links = computed(() => [
  { href: '/#features', text: t('header.features'), isRoute: false },
  { href: '/#demo', text: t('header.demo'), isRoute: false },
  { href: '/#providers', text: t('header.providers'), isRoute: false },
  { href: '/plugins', text: t('header.marketplace'), isRoute: true },
])

const toggleLang = () => {
  locale.value = locale.value === 'zh-CN' ? 'en' : 'zh-CN'
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const login = () => {
  window.location.href = `${API_BASE_URL}/auth/github`
}

const userOptions = computed(() => {
  const opts = [
    { label: t('dashboard.title'), key: 'dashboard' },
    { label: t('submit.title'), key: 'submit' },
    { label: t('auth.logout'), key: 'logout' }
  ]
  if (authStore.user?.role === 'ADMIN') {
    opts.unshift({ label: t('admin.title'), key: 'admin' })
  }
  return opts
})

const handleUserSelect = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    message.success(t('auth.logoutSuccess'))
  } else if (key === 'submit') {
    router.push('/plugins/submit')
  } else if (key === 'admin') {
    router.push('/admin/review')
  } else if (key === 'dashboard') {
    router.push('/dashboard')
  }
}

onMounted(() => {
  authStore.fetchUser()
})
</script>
