<template>
  <section id="demo" class="py-80px overflow-hidden">
    <div class="container-custom">
      <div v-for="(section, index) in sections" :key="section.key" 
           class="grid md:grid-cols-2 gap-10 md:gap-20 items-center mb-30 last:mb-0 showcase-block opacity-0 translate-y-30px">
        
        <!-- Text Content -->
        <div :class="{ 'md:order-last': index % 2 !== 0 }">
          <div class="inline-block px-3 py-1 bg-indigo-50 text-primary rounded-full text-0.8rem font-600 mb-4">
            0{{ index + 1 }}
          </div>
          <h3 class="text-2rem md:text-2.5rem mb-5 font-bold text-text-main leading-tight">{{ section.title }}</h3>
          <p class="text-text-muted text-1.1rem mb-8 leading-relaxed">{{ section.desc }}</p>
          <ul class="space-y-4">
            <li v-for="feature in section.features" :key="feature" class="flex items-start gap-3">
              <div class="i-ph-check-circle-fill text-primary text-1.25rem mt-0.5 shrink-0" /> 
              <span class="text-text-main/80">{{ feature }}</span>
            </li>
          </ul>
        </div>

        <!-- Image -->
        <div class="relative group" :class="{ 'md:order-first': index % 2 !== 0 }">
          <!-- Decorative blurred bg -->
          <div class="absolute inset-0 bg-gradient-to-tr from-primary/20 to-violet-300/20 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div class="rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border-1 border-border/60 bg-white p-2 overflow-hidden transform transition-transform duration-500 hover:scale-[1.02]">
            <img :src="section.image" :alt="section.imageAlt" class="w-full h-auto rounded-xl block bg-slate-50">
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, tm } = useI18n()

const sections = computed(() => [
  {
    key: 'section1',
    title: t('showcase.section1.title'),
    desc: t('showcase.section1.desc'),
    features: tm('showcase.section1.features'),
    image: 'https://i.mji.rip/2026/01/26/114f48702f3d79e4527aeeb68fc45e02.gif',
    imageAlt: t('showcase.section1.imageAlt')
  },
  {
    key: 'section2',
    title: t('showcase.section2.title'),
    desc: t('showcase.section2.desc'),
    features: tm('showcase.section2.features'),
    image: 'https://wmimg.com/i/1550/2026/01/69707abba7d4b.gif',
    imageAlt: t('showcase.section2.imageAlt')
  },
  {
    key: 'section3',
    title: t('showcase.section3.title'),
    desc: t('showcase.section3.desc'),
    features: tm('showcase.section3.features'),
    image: 'https://i.mji.rip/2026/01/26/b94ff1213587c428da665aac830e342c.png',
    imageAlt: t('showcase.section3.imageAlt')
  },
  {
    key: 'section4',
    title: t('showcase.section4.title'),
    desc: t('showcase.section4.desc'),
    features: tm('showcase.section4.features'),
    image: 'https://i.mji.rip/2026/01/26/e7355efe889a37dca766945154e5fff8.png',
    imageAlt: t('showcase.section4.imageAlt')
  }
])

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).style.opacity = '1';
        (entry.target as HTMLElement).style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.showcase-block').forEach((el) => {
    observer.observe(el);
  });
})
</script>
