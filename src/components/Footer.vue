<template>
  <footer class="pt-60px pb-20px border-t-1 border-border bg-white">
    <div class="container-custom">
      <div class="grid md:grid-cols-[2fr_1fr_1fr] gap-10 mb-10">
        <div>
          <div class="flex items-center gap-2 text-1.5rem font-800 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent mb-2">
            <!-- <div class="i-ph-cloud-arrow-up-fill text-primary" /> GioPic -->

             <img :src="logoUrl" alt="GioPic Logo" class="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110">
          <span class="text-xl md:text-sm font-800 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent leading-none">
            {{ t('name') }}
          </span>
          </div>
          <p class="text-text-muted max-w-300px mt-2">{{ t('footer.desc') }}</p>
        </div>
        <div>
          <h4 class="font-bold mb-5 text-text-main">{{ t('footer.products.title') }}</h4>
          <a href="#" class="block mb-2.5 text-text-muted hover:text-primary transition-colors decoration-none">{{ t('footer.products.items[0]') }}</a>
          <a target="_blank" href="https://github.com/ZenEcho/GioPic_Web_Extension/releases" class="block mb-2.5 text-text-muted hover:text-primary transition-colors decoration-none">{{ t('footer.products.items[1]') }}</a>
          <!-- 路由切换到plugins -->
          <router-link to="/plugins" class="block mb-2.5 text-text-muted hover:text-primary transition-colors decoration-none">{{ t('footer.products.items[2]') }}</router-link>
        </div>
        <div>
          <h4 class="font-bold mb-5 text-text-main">{{ t('footer.develop.title') }}</h4>
          <a href="https://github.com/ZenEcho/GioPic_Web_Extension" target="_blank"  class="block mb-2.5 text-text-muted hover:text-primary transition-colors decoration-none">{{ t('footer.develop.items[0]') }}</a>
          <a href="https://github.com/ZenEcho/GioPic_Web_Extension/issues" target="_blank" class="block mb-2.5 text-text-muted hover:text-primary transition-colors decoration-none">{{ t('footer.develop.items[1]') }}</a>
          <a href="https://github.com/ZenEcho/GioPic_Web_Extension" target="_blank" class="block mb-2.5 text-text-muted hover:text-primary transition-colors decoration-none">{{ t('footer.develop.items[2]') }}</a>
        </div>
      </div>
      <div class="text-center pt-5 border-t-1 border-border text-text-muted text-0.9rem">
        &copy; {{ year }} {{ t('footer.copyright') }}
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import logoUrl from '../assets/logo256.png'
const { t } = useI18n()
const year = new Date().getFullYear()
</script>
