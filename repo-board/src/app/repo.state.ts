import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { patch, removeItem, append, updateItem } from "@ngxs/store/operators";
import { GitRepository } from 'azure-devops-extension-api/Git';
import { RepoSettingsModel } from './models/repo-settings.model';
import { RepoStateActions } from './repo-state.actions';
import { RepoService } from './services/repo.service';

import _ from 'lodash';
import { RepoFavoriteModel } from './models/repo-favorite.model';


export interface RepoStateModel {
  settings: RepoSettingsModel[];
  repositories: GitRepository[];
  favorites: RepoFavoriteModel[];
}

@State<RepoStateModel>({
  name: 'repositories',
  defaults: {
    settings: [{ repoId: "asdf", group: "frp" }, { repoId: "4a296ded-a5e2-4b30-bcda-aade34eaac40", group: "dingen" }] as RepoSettingsModel[],
    favorites: [{ repoId: "4a296ded-a5e2-4b30-bcda-aade34eaac40", isFavorite: true }] as RepoFavoriteModel[],
    repositories: []
  }
})
@Injectable()
export class RepoState {

  constructor(private _repoService: RepoService) {

  }

  @Selector()
  static repositories(repoState: RepoStateModel) {
    return repoState.repositories;
  }

  static setting(repoId: string) {
    return createSelector([RepoState], (state: RepoStateModel) => {
      return state.settings.filter(s => s.repoId == repoId)[0];
    });
  }

  static favorite(repoId: string) {
    return createSelector([RepoState], (state: RepoStateModel) => {
      return state.favorites.filter(s => s.repoId == repoId)[0];
    });
  }

  @Selector()
  static groupNames(repoState: RepoStateModel) {
    return _.sortBy(_.uniq(_.map(repoState.settings, s => s.group)), s => s);
  }

  @Action(RepoStateActions.Initialize)
  async add(ctx: StateContext<RepoStateModel>, _: RepoStateActions.Initialize) {

    const [repos, settings] = await Promise.all([this._repoService.getAllRepositories(), this._repoService.LoadRepoSettings()]);

    ctx.patchState({
      repositories: repos,
      settings: settings
    });
  }

  @Action(RepoStateActions.SetGroupName)
  async setGroupName(ctx: StateContext<RepoStateModel>, patch: RepoStateActions.SetGroupName) {
    await this._repoService.setGroup(patch.repositoryId, patch.groupName);
    
    ctx.patchState({
      settings: await this._repoService.LoadRepoSettings()
    });
  }

}
