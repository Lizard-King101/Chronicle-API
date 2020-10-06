import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { SocketService } from 'src/app/socket.service';

@Component({
    selector: 'info-box',
    templateUrl: 'info-box.html'
})
export class InfoBoxComponent implements OnInit{
    @Input() icon;
    @Input() title;
    @Input() socevent;

    value: number = 0;

    constructor (private socket: SocketService) {
        
    }

    ngOnInit() {
        if(this.socevent && this.socevent != "") {
            // add listener for socket event first
            this.socket.io.on(this.socevent, (data: number) => {
                this.value = data;
                console.log('users', this.value);
            });
            // then call initializer for socket value
            this.socket.io.emit(this.socevent+"-get");
        }
    }
}