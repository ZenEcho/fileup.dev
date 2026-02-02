<template>
  <section id="providers" class="bg-dark text-white py-80px text-center">
    <div class="container-custom">
      <h2 class="text-2rem mb-10 font-bold">{{ t('providers.title') }}</h2>
      <div class="flex flex-wrap justify-center gap-4 max-w-900px mx-auto">
        <span v-for="p in providers" :key="p" class="bg-white/10 px-5 py-2 rounded-full text-0.9rem border-1 border-white/10 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-default">
          {{ p }}
        </span>
      </div>
      <p class="mt-8 text-slate-400 text-0.9rem">{{ t('providers.more') }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t, tm } = useI18n()

const providers = computed(() => tm('providers.items') as string[])
</script>
