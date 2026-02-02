import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PluginMarketplace from '../views/PluginMarketplace.vue'
import AuthCallback from '../views/AuthCallback.vue'

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
      component: () => import('../views/SubmitPlugin.vue')
    },
    {
      path: '/admin/review',
      name: 'admin-review',
      component: () => import('../views/AdminReview.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue')
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
    }
  ],
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
