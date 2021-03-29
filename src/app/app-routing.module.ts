import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from 'src/app/dashboard/dashboard.component';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { UserGuard } from 'src/app/guards/user.guard';
import { LoginComponent } from 'src/app/login/login.component';
import { NavComponent } from 'src/app/nav/nav.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [UserGuard] },
  { path: 'register', loadChildren: () => import('./register/register.module').then((m) => m.RegisterModule) },
  { path: 'reset', loadChildren: () => import('./reset-password/reset-password.module').then((m) => m.ResetPasswordModule) },
  { path: 'unlock', loadChildren: () => import('./unlock/unlock.module').then((m) => m.UnlockModule) },
  {
    path: '',
    component: NavComponent,
    children: [
      { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
      { path: 'profile', loadChildren: () => import('./profile/profile.module').then((m) => m.ProfileModule) },
      { path: '**', redirectTo: '' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
