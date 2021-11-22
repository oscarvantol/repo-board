import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { GitRepository } from 'azure-devops-extension-api/Git';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RepoStateActions } from './repo-state.actions';
import { RepoState } from './repo.state';
import { RepoService } from './services/repo.service';

export type ViewType = "favorites" | "all" | string;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private _view: ViewType = "all";
  
  public get view() {
    return this._view;
  }

  public set view(value: ViewType) {
    if (this._view !== value) {
      this._view = value;
      this.gitRepositories$ = this.repoService.gitRepositories$.pipe(map((g) => {
        switch (this.view) {
          case "all":
            return g;
          case "favorites":
            return g.filter(repo => this.repoService.isFavorite(repo.id));
          default:
            return g.filter(repo => this.repoService.getGroup(repo.id) == this.view);
        }
      }));
    }
  }

  public gitRepositories$: Observable<GitRepository[]>;
  public groupNames$: Observable<string[]>;
    
  constructor(private readonly repoService: RepoService, private store:Store) {
    this.gitRepositories$ = this.store.select(RepoState.repositories);
    this.groupNames$ = this.store.select(RepoState.groupNames);
  }


  async ngOnInit() {
    await this.repoService.initialize();
    this.store.dispatch(RepoStateActions.Initialize);
  }


}
