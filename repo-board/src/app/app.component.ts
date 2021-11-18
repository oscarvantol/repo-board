import { Component, OnInit } from '@angular/core';
import { GitRepository } from 'azure-devops-extension-api/Git';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

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

  public get groupNames():string[] {
    return this.repoService.getGroupNames();
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

  public gitRepositories$: Observable<GitRepository[]> = of([]);

  constructor(private readonly repoService: RepoService) {
  }

  async ngOnInit() {
    await this.repoService.initialize();
    this.gitRepositories$ = this.repoService.gitRepositories$;
    if (this.repoService.hasFavorites())
      this.view = 'favorites';
  }

 
}
