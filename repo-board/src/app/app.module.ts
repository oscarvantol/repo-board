import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgxsModule } from '@ngxs/store';

import { AppComponent } from './app.component';
import { RepoComponent } from './repo.component';
import { RepoState } from './state/repo.state';
import { VotePipe } from './vote.pipe';

@NgModule({
  declarations: [
    AppComponent,
    RepoComponent,
    VotePipe
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    NgxsModule.forRoot([RepoState], {
      developmentMode: true
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
