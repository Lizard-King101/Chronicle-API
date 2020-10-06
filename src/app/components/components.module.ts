import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserComponent } from './user/user.component';
import { DashboardComponents } from './dashboard/dashboard.module';

@NgModule({
    declarations: [
        UserComponent
    ],
    entryComponents: [
        UserComponent
    ],
    imports: [
        DashboardComponents,
        CommonModule,
        FormsModule
    ],
    exports: [
        DashboardComponents,
        UserComponent
    ]
})
export class CustomComponents { }