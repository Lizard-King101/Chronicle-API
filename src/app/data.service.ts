import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { CookieService } from './cookie.service';
import { Subject } from 'rxjs';
import { SocketService } from './socket.service';

@Injectable()
export class DataManagerService {
    public prod = environment.production;
    public uploadedPercentage;
    public user;
    private events: any = {};
    public ep: string;

    constructor(
        private http: HttpClient,
        private cookie: CookieService,
        private socket: SocketService,
    ) {
        console.log(this.prod);
        this.ep = this.prod ? '' : 'http://localhost:3000';
    }

    on(key: string) {
        return this.events[key] = new Subject();
    }
    emit(key: string, data?: any) {
        if(this.events[key]) {
            this.events[key].next(data);
        }
    }

    private localSave(key: string, data: any) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    private localDelete(key: string) {
        localStorage.removeItem(key);
    }

    private Localload(key: string) {
        if (localStorage.getItem(key) != null) {
            return JSON.parse(localStorage.getItem(key));
        } else {
            return false;
        }
    }

    public save(key: string, data: any) {
        return this.localSave(key, data);
    }

    public load(key: string) {
        return this.Localload(key);
    }

    public post(command, data) {
        let auth = this.cookie.getCookie('x-auth');
        const headers:HttpHeaders = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3000/',
            'x-auth': auth
        });
        return new Promise((resolve, reject) => {
            console.log(this.ep + '/admin/' + command);
            
            this.http.post( this.ep + '/admin/' + command, JSON.stringify(data), { headers }).toPromise().then((response: any) => {
                // clearTimeout(timeout);
                if (response) {
                    resolve(response);
                } else {
                    resolve(false);
                }
            }).catch((error) => {
                // if (triggerError) this.serverError();
            });
        });
    }

    public async filePost(command: string, data: FormData) {
        return new Promise((res, rej) => {
            // data.append('command', command);
            this.http.post(this.ep + '/admin/' + command, data, {
                reportProgress: true,
                observe: 'events',
                responseType: 'text',
                headers:  new HttpHeaders({processData: 'false'}),
            }).subscribe((event: HttpEvent<any>) => {
                switch (event.type) {
                    case HttpEventType.Sent:
                        // start
                        // load.present();
                        break;
                    case HttpEventType.Response:
                        // complete
                        // load.dismiss();
                        this.uploadedPercentage = 0;
                        res(event.body);
                        break;
                    case 1: {
                        if (Math.round(this.uploadedPercentage) !== Math.round(event['loaded'] / event['total'] * 100)) {
                            this.uploadedPercentage = event['loaded'] / event['total'] * 100;
                            // this.event.publish('loader', this.uploadedPercentage);
                        }
                        break;
                    }
                }
            });
        })
    }

    public get(path, options = false) {
        return new Promise((res, rej) => {
            this.http.get(this.ep + path, {responseType: 'blob'}).subscribe((file) => {
                res(file);
            });
        });
    }

    public loadUser() {
        return new Promise((res) => {
            this.user = this.load('user');
            this.post('check-signin', {user: this.user}).then((user) => {
                if(user){
                    this.user = user[0];
                    this.emit('user-loaded');
                    this.socket.io.emit('register-admin', this.user);
                } else {
                    this.user = null;
                    this.localDelete('user');
                }
                res(user);
            });
        })
    }

    public logOut() {
        this.user = null;
        this.cookie.deleteCookie('x-auth');
        this.localDelete('user');
    }
}
