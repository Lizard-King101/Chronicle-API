import { Component } from '@angular/core';
import { SocketService } from './socket.service';
import { DataManagerService } from './data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'n-pannel';

  constructor(private socket: SocketService, private data: DataManagerService) {
    this.socket.io.on("register-request", () => {
      
    })
  }
}
