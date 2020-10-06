import { Component } from '@angular/core';
import { DataManagerService } from '../data.service';
import { Md5 } from 'ts-md5';
import { Router } from '@angular/router';
import { CookieService } from '../cookie.service';
@Component({
    templateUrl: 'signin.page.html',
    styleUrls: ['signin.page.scss'],
    selector: 'app-signin'
})
export class SigninComponent {
    invalid = false;
    email: string;
    emailValid = true;
    password: string;
    passValid = true;
    passFail = false;
    constructor(private dataMngr: DataManagerService, private router: Router, private cookie: CookieService) {}

    onSignin() {
        this.passFail = false;
        if (this.email && this.password) {
            const pass = Md5.hashStr(this.password);
            this.dataMngr.post('signin', {email: this.email, pass }).then((res: any) => {
                if (res && res.auth_token) {
                    this.cookie.setCookie('x-auth', res.auth_token, 7);
                    this.dataMngr.save('user', res);
                    this.router.navigate(['home'])
                } else {
                    this.password = '';
                    this.passFail = true;
                }
            });
        } else {
            if ( !this.email ) { this.emailValid = false; }
            if ( !this.password ) { this.passValid = false; }
        }
    }
}
