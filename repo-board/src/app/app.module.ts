import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RepoComponent } from './repo.component';
import { VotePipe } from './vote.pipe';

@NgModule({
  declarations: [
    AppComponent,
    RepoComponent,
    VotePipe
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
