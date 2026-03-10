import { createRouter, createWebHistory } from 'vue-router'
import { AuthCallback, HomeView, LoginView, RegisterView, ResetPasswordView, VerifyEmailView } from '@homepage/pages'
import { PluginMarketplace } from '@frontend/pages'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/plugins',
      name: 'plugins',
      component: PluginMarketplace
    },
    {
      path: '/plugins/submit',
      name: 'submit-plugin',
      component: () => import('@frontend/pages/SubmitPlugin.vue')
    },
    {
      path: '/admin',
      component: () => import('@backstage/components/layout/AdminLayout.vue'),
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@backstage/pages/dashboard/index.vue')
        },
        {
          path: 'review',
          name: 'admin-review',
          component: () => import('@backstage/pages/plugin-review/index.vue')
        },
        {
          path: 'plugins',
          name: 'admin-plugins',
          component: () => import('@backstage/pages/plugin-management/index.vue')
        },
        {
          path: 'versions',
          name: 'admin-versions',
          component: () => import('@backstage/pages/version-management/index.vue')
        },
        {
          path: 'comments',
          name: 'admin-comments',
          component: () => import('@backstage/pages/review-management/index.vue')
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@backstage/pages/user-management/index.vue')
        },
        {
          path: 'downloads',
          name: 'admin-downloads',
          component: () => import('@backstage/pages/download-stats/index.vue')
        },
        {
          path: 'logs',
          name: 'admin-logs',
          component: () => import('@backstage/pages/system-logs/index.vue')
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('@backstage/pages/system-settings/index.vue')
        }
      ]
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@frontend/pages/Dashboard.vue')
    },
    {
      path: '/dashboard/profile',
      name: 'dashboard-profile',
      component: () => import('@frontend/pages/ProfileSettings.vue')
    },
    {
      path: '/dashboard/security',
      name: 'dashboard-security',
      component: () => import('@frontend/pages/SecuritySettings.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/auth/verify-email',
      name: 'verify-email',
      component: VerifyEmailView
    },
    {
      path: '/auth/reset-password',
      name: 'reset-password',
      component: ResetPasswordView
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallback
    },
    {
      path: '/api/auth/github/callback',
      name: 'auth-callback-alias',
      component: AuthCallback
    },
    {
      path: '/api/auth/google/callback',
      name: 'auth-callback-google-alias',
      component: AuthCallback
    }  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Handle double slashes in URL which might come from backend redirects
router.beforeEach((to, _from, next) => {
  if (to.path.startsWith('//')) {
    next({ path: to.path.replace(/^\/+/, '/'), query: to.query, hash: to.hash })
  } else {
    next()
  }
})

export default router





