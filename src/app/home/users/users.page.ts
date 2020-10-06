import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataManagerService } from 'src/app/data.service';
import { AddUser } from './add-user/add-user.modal';
import { User } from 'src/app/components/user/user.component';
import { SocketService } from 'src/app/socket.service';

@Component({
    templateUrl: 'users.page.html',
    styleUrls: ['users.page.scss'],
    selector: 'users-page'
})
export class UsersPage implements OnDestroy {
    users: User[];
    page_at: number = 0;
    total: number = 0;
    pages: number[] = [];
    max_pages: number = 0;

    constructor(
        private data: DataManagerService,
        private modal: MatDialog,
        private socket: SocketService
    ) {
        this.page_at = 0;
        this.getUsers();
        this.socket.io.on('cart-purchased', ()=>{
            this.getUsers();
        })
        this.socket.io.on('user-fund', ()=>{
            this.getUsers();
        })
    }

    ngOnDestroy() {
        this.socket.io.off('cart-purchased');
        this.socket.io.off('user-fund');
    }

    getUsers(page: number = null) {
        let data:any = {table: 'users', order_by: 'last_name', order: 'DESC'};
        if(page) data.page = page;
        this.data.post('list', data).then((result: {total: number, data: User[]}) => {
            this.users = result.data;
            this.total = result.total;
            this.max_pages = Math.ceil(this.total / 20);
            this.pages = new Array(this.max_pages);
        })
    }

    onAddUser() {
        let modal = this.modal.open(AddUser);
        modal.afterClosed().subscribe(() => {
            this.getUsers();
        });
    }

}
