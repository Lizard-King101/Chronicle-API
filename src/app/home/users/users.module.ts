import { NgModule } from '@angular/core';
import { UsersPage } from './users.page';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CustomComponents } from 'src/app/components/components.module';

const Routes: Routes = [{
    path: '',
    component: UsersPage
}];

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        CustomComponents,
        RouterModule.forChild(Routes)
    ],
    declarations: [
        UsersPage
    ]
})
export class UsersPageModule {}
