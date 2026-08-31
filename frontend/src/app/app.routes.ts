import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { StudentOverviewComponent } from './features/student-overview/student-overview.component';
import { AgreementsListComponent } from './features/agreements/agreements-list.component';
import { TimelineViewComponent } from './features/timeline/timeline-view.component';
import { CoordinatorDashboardComponent } from './features/dashboard/coordinator-dashboard.component';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { authGuard, coordinatorGuard } from './core/guards/auth.guard';

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
        path: 'timeline',
        component: TimelineViewComponent
      },
      {
        path: 'dashboard',
        component: CoordinatorDashboardComponent,
        canActivate: [coordinatorGuard]
      },
      {
        path: 'reports',
        component: StudentOverviewComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'student-overview'
  }
];
