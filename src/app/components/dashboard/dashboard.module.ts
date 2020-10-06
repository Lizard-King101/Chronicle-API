import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InfoBoxComponent } from './info-box/info-box';
import { DirectChatComponent } from './chat/direct-chat';


@NgModule({
    declarations: [
        InfoBoxComponent,
        DirectChatComponent
    ],
    entryComponents: [
        InfoBoxComponent,
        DirectChatComponent
    ],
    imports: [  
        CommonModule,
        FormsModule
    ],
    exports: [
        InfoBoxComponent,
        DirectChatComponent
    ]
})
export class DashboardComponents { }