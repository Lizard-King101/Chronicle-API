import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { DataManagerService } from './data.service';

@Injectable()
export class AccessGuard implements CanActivate {
    constructor(private dataMngr: DataManagerService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot): Promise<boolean> | boolean {
        return new Promise((res) => {
            const requiresAdmin = route.data.requiresAdmin || false;
            if (requiresAdmin) {
                // Check that the user is logged in...
                this.dataMngr.loadUser().then((user) => {
                    console.log(user);
                    if (user) {
                        res(true);
                    } else {
                        this.router.navigateByUrl('signin');
                        res(false);
                    }
                });
            } else {
                res(true);
            }
        })
    }
}
