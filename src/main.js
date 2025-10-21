import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import router from './router'

import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Tooltip from 'primevue/tooltip'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})
app.use(router)
app.use(ToastService)

app.component('Toast', Toast)
app.component('Button', Button)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Dialog', Dialog)
app.component('InputText', InputText)
app.component('Dropdown', Dropdown)
app.component('InputNumber', InputNumber)

app.directive('tooltip', Tooltip)

app.mount('#app')