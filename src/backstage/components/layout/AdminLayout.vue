<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider } from 'naive-ui'
import { useAdminTheme } from '@backstage/composables/useAdminTheme'
import AdminLayoutInner from './AdminLayoutInner.vue'

// Optional: import specific naive ui dark theme
import { darkTheme } from 'naive-ui'

const { isDark } = useAdminTheme()
</script>

<template>
  <NConfigProvider :theme="isDark ? darkTheme : null">
    <NMessageProvider>
      <NDialogProvider>
        <AdminLayoutInner />
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
