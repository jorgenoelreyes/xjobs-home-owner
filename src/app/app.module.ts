import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { UploadCvsComponent } from './components/upload-cvs/upload-cvs.component';

@NgModule({
  declarations: [AppComponent, UploadCvsComponent],
  imports: [BrowserModule, CommonModule, FormsModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
