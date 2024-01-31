import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TypeView from '@/views/TypeView.vue';
import SelectView from '@/views/SelectView.vue';
import TableView from '@/views/TableView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      beforeEnter(to, from, next) {
        if (to.query.t && to.query.c) {
          next({
            path: `table/${to.query.t}/${to.query.c}`,
            query: {
              exclude: to.query.ex,
            },
            replace: true,
          });
        } else {
          next();
        }
      }
    },
    {
      path: '/type/:type',
      name: 'select',
      component: TypeView,
    },
    {
      path: '/select',
      name: 'multi-select',
      component: SelectView,
    },
    {
      path: '/table/:type/:cat',
      name: 'timetable',
      component: TableView,
    },
  ]
})

export default router
