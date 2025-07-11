import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import router from './router'

// PrimeVue components
import ToastService from 'primevue/toastservice'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import InputNumber from 'primevue/inputnumber'
import Tooltip from 'primevue/tooltip'

const app = createApp(App)

// Use PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: Aura
  }
})
app.use(router)
app.use(ToastService)

// Register PrimeVue components
app.component('Toast', Toast)
app.component('Button', Button)
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Dialog', Dialog)
app.component('InputText', InputText)
app.component('Calendar', Calendar)
app.component('Dropdown', Dropdown)
app.component('TabView', TabView)
app.component('TabPanel', TabPanel)
app.component('ProgressSpinner', ProgressSpinner)
app.component('Accordion', Accordion)
app.component('AccordionTab', AccordionTab)
app.component('InputNumber', InputNumber)

// Register directives
app.directive('tooltip', Tooltip)

app.mount('#app')
