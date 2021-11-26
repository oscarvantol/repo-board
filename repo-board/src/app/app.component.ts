import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { GitRepository } from 'azure-devops-extension-api/Git';
import { Observable, of } from 'rxjs';

import { RepoStateActions } from './state/repo-state.actions';
import { RepoState } from './state/repo.state';
import { RepoService } from './services/repo.service';

export type ViewType = "favorites" | "all" | string;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public view$ = this.store.select(RepoState.view);
  public title = "repo-board";

  public gitRepositories$: Observable<GitRepository[]>;
  public groupNames$: Observable<string[]>;

  constructor(private readonly repoService: RepoService, private store: Store) {
    this.gitRepositories$ = this.store.select(RepoState.repositories);
    this.groupNames$ = this.store.select(RepoState.groupNames);
  }

  async ngOnInit() {
    await this.repoService.initialize();
    this.store.dispatch(RepoStateActions.Initialize);
  }

  public setView(view: "all" | "favorites" | string) {
    this.store.dispatch(new RepoStateActions.SetView(view));
  }

}
