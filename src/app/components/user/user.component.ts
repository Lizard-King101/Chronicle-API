import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { DataManagerService } from 'src/app/data.service';
import { AddUser } from 'src/app/home/users/add-user/add-user.modal';
import { BalanceModal } from 'src/app/home/users/balance/balance.modal';

@Component({
    selector: 'user',
    templateUrl: 'user.component.html',
    styleUrls: ['user.component.scss']
})
export class UserComponent implements OnInit{
    @Input() user;
    @Output() dataBack = new EventEmitter<string>();

    constructor(
        private data: DataManagerService,
        private modal: MatDialog) {
        
    }

    ngOnInit() {
    }

    onUpdateVar() {
        this.data.post('user', this.user);
    }

    onDelete() {
        Swal.fire({
            title: 'Are you sure?',
            text: `You won't be able to revert this!`,
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
          }).then((result) => {
            if (result.value) {
              this.data.post('delete-user', {id: this.user.id}).then((data:any)=>{
                Swal.fire(
                    'Deleted!',
                    data.message,
                    'success'
                  )
              })
            }
          })
    }

    onEdit() {
        this.modal.open(AddUser, {data: this.user}).afterClosed().subscribe((data) => {
            console.log(data);
        });
    }

    editBalance() {
        this.data.post('user_transactions', {user_id: this.user.id}).then((data) => {
            console.log(data);
            
            let modal = this.modal.open(BalanceModal, {width: '50%',data: {data, user:this.user}});
             // modal.afterClosed().subscribe(() => {
            // })
        })
    }

    onPermissions() {

    }
}

export interface User{
    id?: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    password?: string;
    auth_token?: string;
    push_token?: string;
    is_admin?:boolean;
    test_account?:boolean;
}