<template>
  <section id="features" class="py-100px relative overflow-hidden">
    <div class="absolute inset-0 bg-slate-50/50 -z-10 skew-y-3 origin-top-left scale-110"></div>
    
    <div class="container-custom">
      <div class="text-center mb-15">
        <h2 class="text-2.5rem mb-4 font-bold text-text-main">{{ t('features.title') }}</h2>
        <p class="text-text-muted text-1.1rem max-w-600px mx-auto">{{ t('features.subtitle') }}</p>
      </div>
      
      <div class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8">
        <div v-for="(feature, index) in features" :key="index" 
             class="group p-8 rounded-2xl bg-white border border-slate-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] feature-card opacity-0 translate-y-30px relative overflow-hidden">
          
          <!-- Hover Gradient Background -->
          <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10">
            <div class="w-14 h-14 bg-indigo-50 rounded-2xl flex-center text-1.8rem text-primary mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <div :class="feature.icon" />
            </div>
            <h3 class="mb-3 text-1.25rem font-bold text-text-main group-hover:text-primary transition-colors">{{ feature.title }}</h3>
            <p class="text-text-muted text-0.95rem leading-relaxed">{{ feature.desc }}</p>
          </div>
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
