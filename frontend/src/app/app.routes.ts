import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { StudentOverviewComponent } from './features/student-overview/student-overview.component';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    component: LoginComponent
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'student-overview',
        pathMatch: 'full'
      },
      {
        path: 'student-overview',
        component: StudentOverviewComponent
      },
      {
        path: 'tutoring',
        component: StudentOverviewComponent // Sprint 2 expansion
      },
      {
        path: 'agreements',
        component: StudentOverviewComponent // Sprint 2 expansion
      },
      {
        path: 'thesis',
        component: StudentOverviewComponent // Sprint 3 expansion
      },
      {
        path: 'evidence',
        component: StudentOverviewComponent // Sprint 3 expansion
      },
      {
        path: 'timeline',
        component: StudentOverviewComponent // Sprint 4 expansion
      },
      {
        path: 'reports',
        component: StudentOverviewComponent // Sprint 5 expansion
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'student-overview'
  }
];
