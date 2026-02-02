<template>
  <section id="features" class="py-100px">
    <div class="container-custom">
      <div class="text-center mb-15">
        <h2 class="text-2.5rem mb-4 font-bold text-text-main">{{ t('features.title') }}</h2>
        <p class="text-text-muted text-1.1rem">{{ t('features.subtitle') }}</p>
      </div>
      
      <div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
        <div v-for="(feature, index) in features" :key="index" class="p-8 rounded-2xl bg-light border-1 border-transparent transition-all duration-300 hover:bg-white hover:border-primary hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] feature-card opacity-0 translate-y-30px">
          <div class="w-12 h-12 bg-white rounded-xl flex-center text-1.5rem text-primary mb-5 shadow-sm">
            <div :class="feature.icon" />
          </div>
          <h3 class="mb-3 text-1.25rem font-bold text-text-main">{{ feature.title }}</h3>
          <p class="text-text-muted text-0.95rem">{{ feature.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const features = computed(() => [
  { icon: 'i-ph-share-network-fill', title: t('features.list[0].title'), desc: t('features.list[0].desc') },
  { icon: 'i-ph-plug-fill', title: t('features.list[1].title'), desc: t('features.list[1].desc') },
  { icon: 'i-ph-magic-wand-fill', title: t('features.list[2].title'), desc: t('features.list[2].desc') },
  { icon: 'i-ph-stack-fill', title: t('features.list[3].title'), desc: t('features.list[3].desc') },
])

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).style.opacity = '1';
        (entry.target as HTMLElement).style.transform = 'translateY(0)';
      }
    });
  });

  document.querySelectorAll('.feature-card').forEach((el) => {
    observer.observe(el);
  });
})
</script>
