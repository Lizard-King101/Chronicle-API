import { Component, OnInit, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { DataManagerService } from 'src/app/data.service';
import { User } from 'src/app/components/user/user.component';
import { Md5 } from 'ts-md5';

@Component({
    selector: 'add-user',
    templateUrl: 'add-user.modal.html',
    styleUrls: ['add-user.modal.scss']
})
export class AddUser implements OnInit{
    editing: boolean = false;
    user: User = {
        first_name: '',
        last_name: '',
        username: '',
        email: ''
    };

    pass = '';
    pass_conf = '';

    constructor(
        @Inject(MAT_DIALOG_DATA) public originalUser: User, 
        public dialogRef: MatDialogRef<AddUser>,
        public dataMngr: DataManagerService) {
        
    }

    ngOnInit() {
        if(this.originalUser) {
            this.editing = true;
            Object.keys(this.originalUser).forEach((key) => {
                let val = this.originalUser[key];
                this.user[key] = val;
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }

    onSave() {
        if(this.user.id || (this.pass == this.pass_conf && this.pass != '')) {
            if(this.pass == this.pass_conf && this.pass != '') this.user.password = <string>Md5.hashStr(this.pass);
            this.dataMngr.post('user', this.user).then(() => {
                this.dialogRef.close();
            })
        } else {
            Swal.fire({
                title: 'Password Required',
                text: 'A Password is required to add a new account'
            });
        }
        
    }

}