// 应用入口文件 / Application entry file
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { router } from './router'
import App from './App.vue'
import './styles/global.css'

// 创建 Vue 应用实例 / Create Vue application instance
const app = createApp(App)
// 注册 Pinia 状态管理 / Register Pinia state management
app.use(createPinia())
// 注册 Element Plus UI 组件库（仅用于 Demo 页面测试 page-controller）/ Register Element Plus (for Demo page to test page-controller)
app.use(ElementPlus)
// 注册路由 / Register router
app.use(router)
// 挂载应用到 DOM / Mount application to DOM
app.mount('#app')
