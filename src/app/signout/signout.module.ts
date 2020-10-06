import { NgModule } from '@angular/core';
import { SignoutComponent } from './signout.page';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';

const Routes: Routes = [{
    path: '',
    component: SignoutComponent
}];

@NgModule({
    imports: [
        FormsModule,
        RouterModule.forChild(Routes)
    ],
    declarations: [
        SignoutComponent
    ]
})
export class SignoutModule{}
