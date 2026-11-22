import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './ui/styles/tailwind.css'
import './ui/styles/omorphia.scss'
import './styles/theme.css'
import { applyTheme, storedTheme } from './composables/useTheme'

applyTheme(storedTheme())

createApp(App).use(router).mount('#app')
