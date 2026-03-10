<script setup lang="ts">
import { onMounted, provide } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@common/stores/auth'
import { useRouter } from 'vue-router'
import { NLayout, NLayoutContent, NLayoutHeader, NLayoutSider, useMessage } from 'naive-ui'
import { createAdminContext, ADMIN_KEY } from '@backstage/composables/useAdminContext'
import AdminSidebar from './AdminSidebar.vue'
import AdminTopbar from './AdminTopbar.vue'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()

const adminContext = createAdminContext()
provide(ADMIN_KEY, adminContext)

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
  }
  if (authStore.user?.role !== 'ADMIN') {
    message.error('权限不足：仅管理员可访问')
    router.push('/plugins')
    return
  }
  await adminContext.refreshAll()
})
</script>

<template>
  <NLayout has-sider class="h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
    <!-- Sidebar -->
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      class="shadow-sm z-10"
    >
      <AdminSidebar />
    </NLayoutSider>
    
    <!-- Main Content Wrapper -->
    <NLayout class="bg-gray-50 dark:bg-gray-900">
      <NLayoutHeader bordered class="h-[60px] flex items-center px-6 bg-white dark:bg-gray-800 shadow-sm z-10 select-none">
        <AdminTopbar />
      </NLayoutHeader>

      <NLayoutContent class="p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto" style="height: calc(100vh - 60px);">
        <!-- Transition wrapper for views -->
        <RouterView v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </NLayoutContent>
    </NLayout>
  </NLayout>
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
