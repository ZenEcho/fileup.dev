<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'
import { RouterView } from 'vue-router'
import Header from '@common/components/Header.vue'
import Footer from '@common/components/Footer.vue'

// Custom theme override for Naive UI to match the design
const themeOverrides = {
  common: {
    primaryColor: '#6366f1',
    primaryColorHover: '#4f46e5',
  }
}

const route = useRoute()
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NGlobalStyle />
    <NMessageProvider>
      <Header v-if="!isAdminRoute" />
      <main>
        <RouterView />
      </main>
      <Footer v-if="!isAdminRoute" />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
/* Global styles if any remaining not covered by UnoCSS or Naive UI */
html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}
body {
  overflow-x: hidden;
}
</style>
