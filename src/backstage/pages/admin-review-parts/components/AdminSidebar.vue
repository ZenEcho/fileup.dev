<script setup lang="ts">
import { NTag } from 'naive-ui'
import type { ModuleItem, ModuleId } from '@common/types'

const props = defineProps<{
  modules: ModuleItem[]
  activeModule: ModuleId
  nowLabel: string
  moduleBadge: (id: ModuleId) => number | null
}>()

const emit = defineEmits<{
  (event: 'update:activeModule', value: ModuleId): void
}>()
</script>

<template>
  <aside class="admin-sidebar">
    <div class="admin-brand">
      <p class="admin-brand-title">GioPic Web Extension Admin</p>
      <p class="admin-brand-subtitle">插件市场管理员后台</p>
      <p class="admin-brand-time">{{ nowLabel }}</p>
    </div>

    <div class="admin-menu">
      <button v-for="item in modules" :key="item.id" class="admin-menu-item"
        :class="{ 'is-active': activeModule === item.id }" @click="emit('update:activeModule', item.id as ModuleId)">
        <div class="admin-menu-icon" :class="item.icon" />
        <div class="admin-menu-content">
          <span>{{ item.label }}</span>
          <small>{{ item.desc }}</small>
        </div>
        <NTag v-if="moduleBadge(item.id as ModuleId)" round size="small" type="warning">
          {{ moduleBadge(item.id as ModuleId) }}
        </NTag>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(15, 118, 110, 0.18);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.admin-brand-title {
  margin: 0;
  font-size: 1.28rem;
  font-weight: 800;
  color: #0f172a;
}

.admin-brand-subtitle {
  margin: 4px 0 0;
  color: #64748b;
}

.admin-brand-time {
  margin: 10px 0 0;
  color: #0f766e;
  font-size: 0.85rem;
}

.admin-menu {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-menu-item {
  border: 1px solid transparent;
  background: rgba(248, 250, 252, 0.82);
  border-radius: 14px;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.admin-menu-item:hover {
  border-color: rgba(15, 118, 110, 0.32);
  transform: translateY(-1px);
  background: #fff;
}

.admin-menu-item.is-active {
  border-color: rgba(15, 118, 110, 0.48);
  background: linear-gradient(150deg, rgba(20, 184, 166, 0.14), rgba(14, 116, 144, 0.08));
}

.admin-menu-icon {
  color: #0f766e;
  font-size: 1.1rem;
}

.admin-menu-content span {
  display: block;
  font-weight: 700;
  color: #0f172a;
}

.admin-menu-content small {
  display: block;
  margin-top: 2px;
  color: #64748b;
  font-size: 0.75rem;
}

@media (max-width: 920px) {
  .admin-menu {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-menu-item {
    transition: none !important;
  }
}
</style>
