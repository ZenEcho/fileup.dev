<template>
  <section class="relative pt-32 md:pt-180px pb-20 md:pb-100px text-center overflow-hidden">
    <!-- Background Effects -->
    <div class="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50/50 to-white pointer-events-none"></div>
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-slow"></div>
    <div class="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-200/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>

    <div class="container-custom relative z-10">
      <div class="animate-fade-in-up" style="animation-delay: 0.1s;">
        <span class="inline-block px-4 py-1.5 bg-white/80 backdrop-blur-sm border border-indigo-100 text-primary rounded-full text-0.75rem md:text-0.875rem font-600 mb-6 shadow-sm hover:shadow-md transition-shadow cursor-default">
          {{ t('hero.tag') }}
        </span>
      </div>
      
      <h1 class="text-2.5rem md:text-4.5rem leading-tight font-900 mb-6 tracking--0.02em text-text-main animate-fade-in-up" style="animation-delay: 0.2s;">
        <span class="block mb-2 sm:mb-4">{{ t('hero.title.part1') }}<span class="bg-gradient-to-r from-primary via-violet-500 to-indigo-600 bg-clip-text text-transparent inline-block hover:scale-105 transition-transform duration-500 cursor-default">{{ t('hero.title.part2') }}</span></span>
        <span class="block text-2rem md:text-3.5rem font-800 text-slate-700">{{ t('hero.title.part3') }}</span>
      </h1>
      
      <p class="text-1rem md:text-1.25rem text-text-muted max-w-700px mx-auto mb-10 px-4 leading-relaxed animate-fade-in-up" style="animation-delay: 0.3s;">
        {{ t('hero.desc') }}
      </p>
      
      <div class="flex flex-col items-center animate-fade-in-up mb-15" style="animation-delay: 0.4s;">
        <!-- Primary Action Buttons -->
        <div class="flex-center gap-4 flex-wrap mb-6">
          <a :href="primaryInstallUrl" target="_blank" class="btn btn-primary shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-1 min-w-[200px] justify-center">
            <div :class="isEdge ? 'i-lineicons-chrome' : 'i-lineicons-chrome'" class="text-1.2em" /> 
            <span>{{ isEdge ? t('hero.installEdge') : t('hero.install') }}</span>
          </a>
          <a href="https://github.com/ZenEcho/GioPic_Web_Extension" target="_blank" class="btn btn-outline bg-white hover:bg-gray-50 transition-all hover:-translate-y-1">
            <div class="i-ph-github-logo-fill text-1.2em" /> 
            <span>GitHub</span>
          </a>
        </div>

        <!-- Secondary Download Links -->
        <div class="flex items-center gap-2 text-0.875rem text-slate-500 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200/60 shadow-sm">
          <span class="font-medium mr-1">{{ t('hero.otherVersions') }}:</span>
          <a href="https://chromewebstore.google.com/detail/giopic/cjmhdboadkifegpfnflaflbjeehndmak" target="_blank" 
             class="flex items-center gap-1 hover:text-primary transition-colors" title="Chrome Web Store">
            <div class="i-lineicons-chrome" /> 
            <span class="hidden sm:inline">{{ t('hero.chromeStore') }}</span>
          </a>
          <span class="text-slate-300">|</span>
          <a href="https://microsoftedge.microsoft.com/addons/detail/giopic/mfoecnflemgmpgkgkppbdgpmkegmooji" target="_blank" 
             class="flex items-center gap-1 hover:text-primary transition-colors" title="Microsoft Edge Add-ons">
            <div class="i-lineicons-microsoft-edge" /> 
            <span class="hidden sm:inline">{{ t('hero.edgeStore') }}</span>
          </a>
        </div>
      </div>

      <div class="relative max-w-1000px mx-auto animate-fade-in-up" style="animation-delay: 0.6s;">
        <!-- Decorative elements behind image -->
        <div class="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl"></div>
        <div class="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-xl"></div>
        
        <div class="relative rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border-1 border-border/50 bg-white/50 backdrop-blur-sm p-2 md:p-3 overflow-hidden group">
          <img src="https://i.mji.rip/2026/01/14/2bafa0a93887a7bb20d16454648edcd5.png" :alt="t('hero.imageAlt')" class="w-full h-auto rounded-lg shadow-inner transition-transform duration-700 group-hover:scale-[1.01]">
          
          <!-- Glossy effect -->
          <div class="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, computed } from 'vue'

const { t } = useI18n()

const isEdge = ref(false)

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/giopic/cjmhdboadkifegpfnflaflbjeehndmak'
const EDGE_STORE_URL = 'https://microsoftedge.microsoft.com/addons/detail/giopic/mfoecnflemgmpgkgkppbdgpmkegmooji'

const primaryInstallUrl = computed(() => isEdge.value ? EDGE_STORE_URL : CHROME_STORE_URL)

onMounted(() => {
  const ua = navigator.userAgent
  isEdge.value = /Edg/.test(ua)
})
</script>

<style scoped>
.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-pulse-slow {
  animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.1;
    transform: translate(-50%, 0) scale(1);
  }
  50% {
    opacity: 0.15;
    transform: translate(-50%, 0) scale(1.1);
  }
}
</style>
