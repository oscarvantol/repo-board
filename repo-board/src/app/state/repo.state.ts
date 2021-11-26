import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { GitRepository } from 'azure-devops-extension-api/Git';
import { RepoSettingsModel } from '../models/repo-settings.model';
import { RepoStateActions } from './repo-state.actions';
import { RepoService } from '../services/repo.service';

import _ from 'lodash';
import { RepoFavoriteModel } from '../models/repo-favorite.model';

export interface RepoStateModel {
  settings: RepoSettingsModel[];
  repositories: GitRepository[];
  favorites: RepoFavoriteModel[];
  view: "all" | "favorites" | string;
}

@State<RepoStateModel>({
  name: 'repositories',
  defaults: {
    settings: [],
    favorites: [],
    repositories: [],
    view: "all"
  }
})
@Injectable()
export class RepoState {

  constructor(private _repoService: RepoService) {

  }

  @Selector()
  static repositories(repoState: RepoStateModel) {
    return repoState.repositories.filter(r => repoState.view == "all" ||
      (repoState.view == "favorites" && repoState.favorites.filter(f => f.id == r.id)[0]?.isFavorite) ||
      repoState.settings.filter(s => s.id == r.id)[0]?.group == repoState.view
    );
  }

  @Selector()
  static view(repoState: RepoStateModel): "all" | "favorites" | string {
    return repoState.view;
  }

  static setting(repoId: string) {
    return createSelector([RepoState], (state: RepoStateModel) => {
      return state.settings.filter(s => s.id == repoId)[0];
    });
  }

  static favorite(repoId: string) {
    return createSelector([RepoState], (state: RepoStateModel) => {
      return state.favorites.filter(s => s.id == repoId)[0];
    });
  }

  @Selector()
  static groupNames(repoState: RepoStateModel) {
    return _.sortBy(_.uniq(_.map(repoState.settings, s => s.group)), s => s);
  }

  @Action(RepoStateActions.Initialize)
  async add(ctx: StateContext<RepoStateModel>, _: RepoStateActions.Initialize) {

    const [repos, settings, favorites] = await Promise.all([this._repoService.getAllRepositories(), this._repoService.getRepoSettings(), this._repoService.getFavorites()]);

    ctx.patchState({
      repositories: repos,
      settings: settings,
      favorites: favorites
    });
  }

  @Action(RepoStateActions.SetView)
  async setView(ctx: StateContext<RepoStateModel>, patch: RepoStateActions.SetView) {
    ctx.patchState({
      view: patch.view
    });
  }

  @Action(RepoStateActions.SetGroupName)
  async setGroupName(ctx: StateContext<RepoStateModel>, patch: RepoStateActions.SetGroupName) {
    await this._repoService.saveRepoSetting({ id: patch.repositoryId, group: patch.groupName, hiddenBranches: [] } as RepoSettingsModel);
    ctx.patchState({
      settings: await this._repoService.getRepoSettings()
    });
  }

  @Action(RepoStateActions.SetFavorite)
  async setFavorite(ctx: StateContext<RepoStateModel>, patch: RepoStateActions.SetFavorite) {
    await this._repoService.saveFavorite({ id: patch.repositoryId, isFavorite: patch.isFavorite } as RepoFavoriteModel);

    ctx.patchState({
      favorites: await this._repoService.getFavorites()
    });
  }

}
