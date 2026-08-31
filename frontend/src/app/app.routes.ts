import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { StudentOverviewComponent } from './features/student-overview/student-overview.component';
import { AgreementsListComponent } from './features/agreements/agreements-list.component';
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
        component: StudentOverviewComponent
      },
      {
        path: 'agreements',
        component: AgreementsListComponent
      },
      {
        path: 'thesis',
        component: StudentOverviewComponent // Sprint 3
      },
      {
        path: 'evidence',
        component: StudentOverviewComponent // Sprint 3
      },
      {
        path: 'timeline',
        component: StudentOverviewComponent // Sprint 4
      },
      {
        path: 'reports',
        component: StudentOverviewComponent // Sprint 5
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'student-overview'
  }
];
