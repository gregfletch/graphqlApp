import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from 'src/app/dashboard/dashboard.component';
import { AuthGuard } from 'src/app/guards/auth.guard';
import { UserGuard } from 'src/app/guards/user.guard';
import { LoginComponent } from 'src/app/login/login.component';

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [UserGuard] },
  { path: 'profile', loadChildren: () => import('./profile/profile.module').then((m) => m.ProfileModule) },
  { path: 'register', loadChildren: () => import('./register/register.module').then((m) => m.RegisterModule) },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
