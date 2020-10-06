import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { APP_BASE_HREF, CommonModule } from '@angular/common';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { MatDialogModule } from '@angular/material/dialog';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CookieService } from './cookie.service';
import { CustomComponents } from './components/components.module';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';

import { AddUser } from './home/users/add-user/add-user.modal';

import { AccessGuard } from './access-gaurd.service';
import { DataManagerService } from './data.service';
import { SocketService } from './socket.service';
import { BalanceModal } from './home/users/balance/balance.modal';

@NgModule({
  declarations: [
    AppComponent,
    AddUser,
    BalanceModal
  ],
  entryComponents: [
    AddUser,
    BalanceModal
  ],
  imports: [
    CustomComponents,
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MatDialogModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    FroalaEditorModule.forRoot(),
    FroalaViewModule.forRoot()
  ],
  providers: [
    AccessGuard,
    DataManagerService,
    SocketService,
    CookieService,
    { provide: APP_BASE_HREF, useValue: '/' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
