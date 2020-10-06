import { NgModule } from '@angular/core';
import { HomeComponent } from './home.page';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';

const Routes: Routes = [{
    path: '',
    component: HomeComponent,
    children: [
        {
            path: 'dashboard',
            loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
        },
        {
            path: 'users',
            loadChildren: () => import('./users/users.module').then(m => m.UsersPageModule)
        },
        {
            path: '',
            pathMatch: 'full',
            redirectTo: 'dashboard'
        },
        {
            path: '**',
            pathMatch: 'full',
            redirectTo: 'dashboard'
        }
    ]
}];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(Routes)
    ],
    declarations: [
        HomeComponent
    ]
})
export class HomeModule{}