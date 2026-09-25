import { createRouter, createWebHistory } from 'vue-router';
import AboutView from '@/pages/AboutView.vue';
import HomeView from '@/pages/HomeView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/about', name: 'about', component: AboutView },
  ],
});
