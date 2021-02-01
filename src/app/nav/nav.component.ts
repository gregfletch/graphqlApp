import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { RestResponse } from 'src/app/models/rest-response';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent {
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map((result: BreakpointState) => result.matches),
    shareReplay()
  );

  constructor(private authService: AuthService, private breakpointObserver: BreakpointObserver, private router: Router) {}

  logout(): void {
    this.authService.logout().subscribe(
      (_response: RestResponse) => {
        this.router.navigate(['/login']);
      },
      (error: HttpErrorResponse) => {
        console.log('LOGOUT ERROR = ', error);
      }
    );
  }
}
