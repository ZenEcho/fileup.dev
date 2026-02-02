<script setup lang="ts">
import { NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'
import { RouterView } from 'vue-router'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'

// Custom theme override for Naive UI to match the design
const themeOverrides = {
  common: {
    primaryColor: '#6366f1',
    primaryColorHover: '#4f46e5',
  }
}
</script>

<template>
  <NConfigProvider :theme-overrides="themeOverrides">
    <NGlobalStyle />
    <NMessageProvider>
      <Header />
      <main>
        <RouterView />
      </main>
      <Footer />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
/* Global styles if any remaining not covered by UnoCSS or Naive UI */
html {
  scroll-behavior: smooth;
}
</style>
