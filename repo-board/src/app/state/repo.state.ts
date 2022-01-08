import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { GitBranchStats, GitRepository, GitPullRequest } from 'azure-devops-extension-api/Git';
import { RepoSettingsModel } from '../models/repo-settings.model';
import { RepoStateActions } from './repo-state.actions';
import { RepoService } from '../services/repo.service';

import _ from 'lodash';
import { RepoFavoriteModel } from '../models/repo-favorite.model';


export interface RepoStateModel {
  settings: RepoSettingsModel[];
  repositories: GitRepository[];
  favorites: RepoFavoriteModel[];
  branches: Map<string, GitBranchStats[]>;
  pullRequests: Map<string, GitPullRequest[]>;
  view: "all" | "favorites" | string;
}

@State<RepoStateModel>({
  name: 'repositories',
  defaults: {
    settings: [],
    favorites: [],
    repositories: [],
    branches: new Map<string, GitBranchStats[]>(),
    pullRequests: new Map<string, GitPullRequest[]>(),
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

  static branches(repoId: string) {
    return createSelector([RepoState], (state: RepoStateModel) => {
      return state.branches.get(repoId);
    });
  }

  static visibleBranches(repoId: string) {
    return createSelector([RepoState], (state: RepoStateModel) => {
      const hiddenBranches = state.settings.filter(s => s.id == repoId)[0]?.hiddenBranches ?? [];
      return state.branches.get(repoId)?.filter(b => hiddenBranches.indexOf(b.name) == -1);
    });
  }

  static pullRequests(repoId: string) {
    return createSelector([RepoState], (state: RepoStateModel) => {
      return state.pullRequests.get(repoId);
    });
  }

  @Selector()
  static groupNames(repoState: RepoStateModel) {
    const settings = repoState.settings.filter(s => repoState.repositories.map(r => r.id).indexOf(s.id) >= 0);
    return _.sortBy(_.uniq(_.map(settings, s => s.group)), s => s);
  }

  @Action(RepoStateActions.Initialize)
  async initialize(ctx: StateContext<RepoStateModel>, _: RepoStateActions.Initialize) {

    const [repos, settings, favorites] = await Promise.all([this._repoService.getAllRepositories(), this._repoService.getRepoSettings(), this._repoService.getFavorites()]);

    ctx.patchState({
      repositories: repos,
      settings: settings,
      favorites: favorites
    });
  }

  @Action(RepoStateActions.LoadBranches)
  async loadBranches(ctx: StateContext<RepoStateModel>, action: RepoStateActions.LoadBranches) {
    const branches = await this._repoService.getBranches(action.repository);

    ctx.patchState({
      branches: ctx.getState().branches.set(action.repository.id, branches)
    });
  }

  @Action(RepoStateActions.LoadPullRequests)
  async loadPullRequests(ctx: StateContext<RepoStateModel>, action: RepoStateActions.LoadPullRequests) {
    const pullRequests = await this._repoService.getPullRequests(action.repositoryId);

    ctx.patchState({
      pullRequests: ctx.getState().pullRequests.set(action.repositoryId, pullRequests)
    });
  }

  @Action(RepoStateActions.SetView)
  async setView(ctx: StateContext<RepoStateModel>, patch: RepoStateActions.SetView) {
    ctx.patchState({
      view: patch.view
    });
  }

  @Action(RepoStateActions.UpdateRepoSettings)
  async setGroupName(ctx: StateContext<RepoStateModel>, patch: RepoStateActions.UpdateRepoSettings) {
    await this._repoService.saveRepoSetting({ id: patch.repositoryId, group: patch.groupName, hiddenBranches: patch.hiddenBranches } as RepoSettingsModel);
    ctx.patchState({
      settings: await this._repoService.getRepoSettings(),
      branches: ctx.getState().branches
    });
  }

  @Action(RepoStateActions.ReloadSettings)
  async reloadSettings(ctx: StateContext<RepoStateModel>, patch: RepoStateActions.ReloadSettings) {
    ctx.patchState({
      settings: await this._repoService.getRepoSettings(),
      branches: ctx.getState().branches
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
