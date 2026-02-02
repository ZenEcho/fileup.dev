<template>
  <section class="pt-32 md:pt-180px pb-20 md:pb-100px text-center bg-[radial-gradient(circle_at_top,_#eef2ff,_#fff_40%)]">
    <div class="container-custom">
      <span class="inline-block px-4 py-1.5 bg-indigo-100 text-primary rounded-full text-0.75rem md:text-0.875rem font-600 mb-6">{{ t('hero.tag') }}</span>
      <h1 class="text-2.5rem md:text-4rem leading-tight font-800 mb-6 tracking--0.02em text-text-main">
        <span class="block mb-2 sm:mb-4">{{ t('hero.title.part1') }}<span class="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">{{ t('hero.title.part2') }}</span></span>
        <span class="block">{{ t('hero.title.part3') }}</span>
      </h1>
      <p class="text-1rem md:text-1.25rem text-text-muted max-w-700px mx-auto mb-10 px-4">
        {{ t('hero.desc') }}
      </p>
      
      <div class="flex-center gap-4 mb-15 flex-wrap">
        <a href="https://chromewebstore.google.com/detail/giopic/cjmhdboadkifegpfnflaflbjeehndmak" target="_blank" class="btn btn-primary">
          <div class="i-ph-google-chrome-logo-fill" /> {{ t('hero.install') }}
        </a>
        <a href="https://github.com/ZenEcho/GioPic_Web_Extension" target="_blank" class="btn btn-outline">
          <div class="i-ph-code-bold" /> {{ t('hero.source') }}
        </a>
      </div>

      <div class="relative max-w-1000px mx-auto rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border-1 border-border bg-white p-2.5 overflow-hidden hero-showcase hidden md:block">
        <img src="https://i.mji.rip/2026/01/14/2bafa0a93887a7bb20d16454648edcd5.png" :alt="t('hero.imageAlt')" class="w-full h-auto rounded-lg">
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.hero-showcase {
  animation: slideUp 0.8s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
