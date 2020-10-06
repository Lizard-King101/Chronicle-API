import { NgModule } from '@angular/core';
import { DashboardComponent } from './dashboard.page';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CustomComponents } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';

const Routes: Routes = [{
    path: '',
    component: DashboardComponent
}];

@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        CustomComponents,
        RouterModule.forChild(Routes)
    ],
    declarations: [
        DashboardComponent
    ]
})
export class DashboardModule {}
