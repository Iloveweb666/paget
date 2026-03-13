// 应用入口文件 / Application entry file
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/global.css'

// 创建 Vue 应用实例 / Create Vue application instance
const app = createApp(App)
// 注册 Pinia 状态管理 / Register Pinia state management
app.use(createPinia())
// 挂载应用到 DOM / Mount application to DOM
app.mount('#app')
