import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserGuard } from 'src/app/guards/user.guard';
import { UnlockComponent } from './unlock.component';

const routes: Routes = [{ path: '', component: UnlockComponent, canActivate: [UserGuard] }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UnlockRoutingModule {}
