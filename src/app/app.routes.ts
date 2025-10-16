import { Routes } from '@angular/router';

export const routes: Routes = [
  // --- Rutas Principales de la App ---
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register', // RUTA PARA LA PÁGINA DE REGISTRO
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },

  // --- Rutas para Gestión y Detalles ---
  {
    path: 'create-event',
    loadComponent: () => import('./create-event/create-event.page').then( m => m.CreateEventPage)
  },
  {
    path: 'create-comunicado',
    loadComponent: () => import('./create-comunicado/create-comunicado.page').then( m => m.CreateComunicadoPage)
  },
  {
    path: 'edit-comunicado/:id',
    loadComponent: () => import('./edit-comunicado/edit-comunicado.page').then( m => m.EditComunicadoPage)
  },
  {
    path: 'create-user',
    loadComponent: () => import('./create-user/create-user.page').then( m => m.CreateUserPage)
  },
  {
    path: 'edit-user/:id',
    loadComponent: () => import('./edit-user/edit-user.page').then( m => m.EditUserPage)
  },
  {
    path: 'course-detail/:id',
    loadComponent: () => import('./course-detail/course-detail.page').then( m => m.CourseDetailPage)
  },
  {
    path: 'user-list',
    loadComponent: () => import('./user-list/user-list.page').then( m => m.UserListPage)
  },
  {
    path: 'user-list/:role',
    loadComponent: () => import('./user-list/user-list.page').then( m => m.UserListPage)
  },
  {
    path: 'grade-management',
    loadComponent: () => import('./grade-management/grade-management.page').then( m => m.GradeManagementPage)
  },
  {
    path: 'manage-courses',
    loadComponent: () => import('./manage-courses/manage-courses.page').then( m => m.ManageCoursesPage)
  },
  {
    path: 'manage-schedule/:id',
    loadComponent: () => import('./manage-schedule/manage-schedule.page').then( m => m.ManageSchedulePage)
  },
  {
    path: 'manage-assignments',
    loadComponent: () => import('./manage-assignments/manage-assignments.page').then( m => m.ManageAssignmentsPage)
  },
  {
    path: 'manage-assignments/:id',
    loadComponent: () => import('./manage-assignments/manage-assignments.page').then( m => m.ManageAssignmentsPage)
  },

  // --- Rutas de Redirección (SIEMPRE AL FINAL) ---
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**', // Cualquier otra ruta no encontrada
    redirectTo: 'login',
  },
];

