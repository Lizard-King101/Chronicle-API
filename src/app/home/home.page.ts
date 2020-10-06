import { Component } from '@angular/core';
import { DataManagerService } from '../data.service';

@Component({
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
    selector: 'app-home'
})
export class HomeComponent {
    menuOpen = false;
    sideMenu = false;
    constructor(public dataMngr: DataManagerService) {
        this.dataMngr.loadUser();
        console.log('USER', this.dataMngr.user.first_name);
    }

    onToggleMenu() { this.menuOpen = !this.menuOpen; }
    onToggleSide() { this.sideMenu = !this.sideMenu; }
}