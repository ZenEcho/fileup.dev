<template>
  <section id="demo" class="py-80px">
    <div class="container-custom">
      <div class="grid md:grid-cols-2 gap-15 items-center mb-25 showcase-block opacity-0 translate-y-30px">
        <div>
          <h3 class="text-2rem mb-5 font-bold text-text-main">{{ t('showcase.section1.title') }}</h3>
          <p class="text-text-muted text-1.1rem mb-6">{{ t('showcase.section1.desc') }}</p>
          <ul class="space-y-3">
            <li v-for="item in list1" :key="item" class="flex items-center gap-2.5">
              <div class="i-fa-solid-check text-secondary" /> <span>{{ item }}</span>
            </li>
          </ul>
        </div>
        <div class="rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] border-1 border-border overflow-hidden">
          <img src="https://i.mji.rip/2026/01/26/114f48702f3d79e4527aeeb68fc45e02.gif" :alt="t('showcase.section1.imageAlt')" class="w-full h-auto block">
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-15 items-center showcase-block opacity-0 translate-y-30px">
        <div class="order-last md:order-first rounded-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] border-1 border-border overflow-hidden">
          <img src="https://wmimg.com/i/1550/2026/01/69707abba7d4b.gif" :alt="t('showcase.section2.imageAlt')" class="w-full h-auto block">
        </div>
        <div>
          <h3 class="text-2rem mb-5 font-bold text-text-main">{{ t('showcase.section2.title') }}</h3>
          <p class="text-text-muted text-1.1rem mb-6">{{ t('showcase.section2.desc') }}</p>
          <ul class="space-y-3">
            <li v-for="item in list2" :key="item" class="flex items-center gap-2.5">
              <div class="i-ph-check-bold text-secondary" /> <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const list1 = computed(() => [
  t('showcase.section1.features[0]'),
  t('showcase.section1.features[1]'),
  t('showcase.section1.features[2]')
])
const list2 = computed(() => [
  t('showcase.section2.features[0]'),
  t('showcase.section2.features[1]'),
  t('showcase.section2.features[2]')
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

  document.querySelectorAll('.showcase-block').forEach((el) => {
    observer.observe(el);
  });
})
</script>
