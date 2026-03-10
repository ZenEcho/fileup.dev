<script setup lang="ts">
import { computed, h } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  NAvatar,
  NButton,
  NDataTable,
  NInput,
  NPagination,
  NSpace,
  NTag,
  type DataTableColumns,
} from 'naive-ui';
import type { LoginSource, UserRow } from '@common/types';
import UserRoleTag from './UserRoleTag.vue';
import UserStatusTag from './UserStatusTag.vue';

const props = defineProps<{
  users: UserRow[];
  loading: boolean;
  keyword: string;
  page: number;
  pageSize: number;
  total: number;
  formatDate: (value?: string | null) => string;
}>();

const emit = defineEmits<{
  (event: 'update:keyword', value: string): void;
  (event: 'update:page', value: number): void;
  (event: 'view', user: UserRow): void;
}>();

const { t } = useI18n();

const resolveAuthProviders = (row: UserRow): LoginSource[] => {
  if (Array.isArray(row.authProviders) && row.authProviders.length > 0) {
    return row.authProviders;
  }

  if (row.authProvider && row.authProvider !== 'MIXED') {
    return [row.authProvider as LoginSource];
  }

  return [];
};

const authProviderLabel = (provider: LoginSource) => {
  return t(`account.authProviderLabel.${provider}`);
};

const columns = computed<DataTableColumns<UserRow>>(() => [
  {
    title: t('admin.users.user'),
    key: 'username',
    minWidth: 220,
    render: (row) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(NAvatar, {
          size: 'small',
          round: true,
          src: row.avatar || undefined,
        }),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-medium' }, row.username),
          h('span', { class: 'text-xs text-gray-500' }, row.id),
        ]),
      ]);
    },
  },
  {
    title: t('account.profile.email'),
    key: 'email',
    minWidth: 180,
    render: (row) => row.email || '-',
  },
  {
    title: t('account.profile.authProvider'),
    key: 'authProvider',
    minWidth: 180,
    render: (row) => {
      const providers = resolveAuthProviders(row);
      if (providers.length <= 0) {
        return '-';
      }

      return h(
        'div',
        { class: 'flex flex-wrap gap-1' },
        providers.map((provider) =>
          h(
            NTag,
            {
              size: 'small',
              round: true,
            },
            {
              default: () => authProviderLabel(provider),
            },
          ),
        ),
      );
    },
  },
  {
    title: t('admin.users.role'),
    key: 'role',
    width: 120,
    render: (row) => h(UserRoleTag, { role: row.role }),
  },
  {
    title: t('admin.common.status'),
    key: 'status',
    width: 130,
    render: (row) => h(UserStatusTag, { status: row.status }),
  },
  {
    title: t('admin.users.pluginCount'),
    key: 'pluginCount',
    width: 110,
  },
  {
    title: t('account.profile.lastLoginAt'),
    key: 'lastLoginAt',
    width: 180,
    render: (row) => props.formatDate(row.lastLoginAt),
  },
  {
    title: t('admin.common.actions'),
    key: 'actions',
    width: 100,
    render: (row) =>
      h(
        NButton,
        {
          size: 'small',
          onClick: () => emit('view', row),
        },
        {
          default: () => t('admin.users.detail'),
        },
      ),
  },
]);
</script>

<template>
  <div class="flex flex-col gap-4">
    <NSpace justify="space-between" align="center">
      <NInput
        :value="keyword"
        clearable
        :placeholder="t('admin.users.searchPlaceholder')"
        @update:value="emit('update:keyword', $event)"
      />
    </NSpace>

    <NDataTable
      :loading="loading"
      :columns="columns"
      :data="users"
      :bordered="false"
      striped
      size="small"
    />

    <div class="flex justify-end">
      <NPagination
        :page="page"
        :page-size="pageSize"
        :item-count="total"
        @update:page="emit('update:page', $event)"
      />
    </div>
  </div>
</template>
