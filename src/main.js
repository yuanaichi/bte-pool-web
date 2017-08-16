import Vue from 'vue'
import VueRouter from 'vue-router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import './assets/css/app.css'
import {default as STORAGE} from './storage.js'

window.STORAGE = STORAGE;

Vue.use(VueRouter)
Vue.use(ElementUI)

import App from './App.vue'

import {default as routes} from './router.js'

var router = new VueRouter({
    // hashbang: true, //hash路由
    history:true,
    saveScrollPosition:true,
    transitionOnLoad: false, // 初次加载时是否使用动画,
    routes
})

window.router = router;

new Vue({
  render: h => h(App),
  router
}).$mount('#app');
