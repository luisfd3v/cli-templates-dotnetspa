import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: '__PROJECT_NAME__',
    loadComponent: () => import('./pages/home').then((page) => page.Home),
  },
  {
    path: 'about',
    title: 'About',
    loadComponent: () => import('./pages/about').then((page) => page.About),
  },
  { path: '**', redirectTo: '' },
];
