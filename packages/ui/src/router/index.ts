/**
 * 路由配置 / Router configuration
 *
 * / → WidgetView（空白页 + 提示信息）/ WidgetView (blank page + hint text)
 * /demo → DemoView（业务表单演示页）/ DemoView (business form demo page)
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'widget',
      component: () => import('../views/WidgetView.vue'),
    },
    {
      path: '/demo',
      name: 'demo',
      component: () => import('../views/DemoView.vue'),
    },
  ],
})

export { router }
