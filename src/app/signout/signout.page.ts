import { Component } from '@angular/core';
import { DataManagerService } from '../data.service';
import { CookieService } from '../cookie.service';
@Component({
    templateUrl: 'signout.page.html',
    styleUrls: ['signout.page.scss'],
    selector: 'app-signout'
})
export class SignoutComponent {
    constructor(private dataMngr: DataManagerService, private cookie: CookieService) {
        this.cookie.deleteCookie('x-auth');
        this.dataMngr.logOut();
    }

    
}
