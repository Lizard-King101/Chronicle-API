import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataManagerService } from 'src/app/data.service';
import { User } from 'src/app/components/user/user.component';
import Swal from 'sweetalert2';

@Component({
    selector: 'balance',
    templateUrl: 'balance.modal.html',
    styleUrls: ['balance.modal.scss']
})
export class BalanceModal {
    transactions;
    user

    transaction: Transaction = {
        type: null,
        amount: 0,
        description: ''
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public transactionData,
        public dialogRef: MatDialogRef<BalanceModal>, 
        private data: DataManagerService) { 
            this.transactions = transactionData.transactions;
            this.user = transactionData.user;
            
        }

    submit() {
        this.data.post('submit_transaction', {user_id: this.user.id, transaction: this.transaction}).then((data: any) => {
            if(data.err) {
                Swal.fire({
                    title: 'Error',
                    text: data.err
                });
            } else {
                this.user.balance = data.balance;
                this.transactions.push(data.transaction);
            }
            
        })
    }

    onClose() {
        this.dialogRef.close();
    }
}

interface Transaction {
    type: 'purchase' | 'credit' | 'remove';
    amount: number;
    description: string;
}