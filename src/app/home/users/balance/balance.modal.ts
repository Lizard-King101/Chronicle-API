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
    transactions: any[];
    currencies: any[];
    balances: any[];
    user

    transaction: Transaction = {
        type: null,
        currency: null,
        amount: 0,
        description: ''
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public transactionData,
        public dialogRef: MatDialogRef<BalanceModal>, 
        private data: DataManagerService) { 
            this.transactions = transactionData.data.transactions;
            this.currencies = transactionData.data.currencies;
            this.balances = transactionData.data.balances;
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
                let found = false;
                this.balances.forEach((balance, index) => {
                    if(balance.currency == data.balance.currency) {
                        found = true;
                        this.balances[index].balance = data.balance.balance;
                    }
                });
                if(!found) this.balances.push(data.balance);
                this.transactions.unshift(data.transaction);
            }
            
        })
    }

    onClose() {
        this.dialogRef.close();
    }
}

interface Transaction {
    type: 'purchase' | 'credit' | 'remove';
    currency: number;
    amount: number;
    description: string;
}