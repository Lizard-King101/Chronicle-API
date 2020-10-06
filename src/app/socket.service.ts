import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import io from 'socket.io-client';

@Injectable()
export class SocketService{
    public prod = environment.production;
    public io;
    constructor(){
        this.io = io(this.prod ? 'api.thegoldspot.com' : 'localhost:3000');
        
    }
}