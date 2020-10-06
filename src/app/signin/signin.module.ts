import { NgModule } from '@angular/core';
import { SigninComponent } from './signin.page';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

const Routes: Routes = [{
    path: '',
    component: SigninComponent
}];

@NgModule({
    imports: [
        FormsModule,
        RouterModule.forChild(Routes)
    ],
    declarations: [
        SigninComponent
    ]
})
export class SigninModule{}
