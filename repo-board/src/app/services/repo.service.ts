import { Injectable } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, IProjectInfo, IExtensionDataService, IExtensionDataManager } from "azure-devops-extension-api";
import { GitRestClient, GitRepository, GitPullRequestSearchCriteria, PullRequestStatus, GitBranchStats, GitPullRequest } from "azure-devops-extension-api/Git";
import { Observable, of } from 'rxjs';

import RepositoriesJson from "../../assets/data/repositories.json";
import BranchesJson from "../../assets/data/branches.json";
import PullRequestsJson from "../../assets/data/pullrequests.json";
import { RepoSettingsModel } from '../models/repo-settings.model';
import _ from 'lodash';


export interface RepoBranches {
  repositoryId: string,
  branches: GitBranchStats[]
}

@Injectable({
  providedIn: 'root'
})
export class RepoService {
  public get online() {
    return document.domain !== "localhost";
  }

  private _branchesJson: RepoBranches[] = [];
  private _pullRequests: GitPullRequest[] = [];
  private _gitClient?: GitRestClient;
  private _repoSettings: RepoSettingsModel[] = [];
  private _project: IProjectInfo | undefined;
  private _extensionDataManager?: IExtensionDataManager;
  private _repoSettingsDocuments: string = "";
  public gitRepositories$: Observable<GitRepository[]> = of([]);

  constructor() {
    if (this.online)
      SDK.init();
  }

  public initialize = async () => this.online
    ? this.initOnline()
    : this.initOffline();

  public async getBranches(gitRepository: GitRepository) {
    var gitBranches: GitBranchStats[] = [];
    if (this.online) {
      const gitClient = getClient(GitRestClient);
      gitBranches = await gitClient.getBranches(gitRepository.id);
    } else {
      gitBranches = this._branchesJson.find(b => b.repositoryId === gitRepository.id)?.branches ?? [];
    }

    return gitBranches.filter((b) => `refs/heads/${b.name}` !== gitRepository.defaultBranch);
  }

  public async getPullRequests(gitRepository: GitRepository) {
    var pullRequests: GitPullRequest[] = [];
    if (this.online) {
      const gitClient = getClient(GitRestClient);
      pullRequests = await gitClient.getPullRequests(gitRepository.id, { status: PullRequestStatus.Active } as GitPullRequestSearchCriteria);
    } else {
      pullRequests = this._pullRequests.filter(pr => pr.repository.id === gitRepository.id);
    }

    return pullRequests;
  }

  private async initOnline() {
    await SDK.ready();

    const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
    await this.initDataManager();

    this._gitClient = getClient(GitRestClient);
    this._project = await projectService.getProject();
    if (this._project === undefined)
      throw ("Unable to load project");

    const gitRepositories = await this._gitClient.getRepositories(this._project.id);
    this.gitRepositories$ = of(gitRepositories.sort(this.sortRepositories));
    this.reloadRepoSettings();
  }

  private async initOffline() {
    const gitRepositories = RepositoriesJson as any as GitRepository[];
    this.gitRepositories$ = of(gitRepositories.sort(this.sortRepositories));
    this._branchesJson = BranchesJson as [];
    this._pullRequests = PullRequestsJson as any as GitPullRequest[];
  }

  private sortRepositories = (repoA: GitRepository, repoB: GitRepository) => {
    const [name1, name2] = [repoA.name?.toLocaleLowerCase(), repoB.name?.toLocaleLowerCase()];
    if (name1 > name2) return 1;
    if (name1 < name2) return -1;
    return 0;
  };

  private async initDataManager() {
    let dataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
    let extensionContext = SDK.getExtensionContext();
    this._extensionDataManager = await dataService.getExtensionDataManager(`${extensionContext.publisherId}.${extensionContext.extensionId}`, await SDK.getAccessToken());
    this._repoSettingsDocuments = `repository-settings-${this._project?.id}`
  }

  private async reloadRepoSettings() {
    if (!this.online)
      return;

    try {
      this._repoSettings = await this._extensionDataManager?.getDocuments(this._repoSettingsDocuments) as RepoSettingsModel[];
    } catch (e) {
      console.error("error fetching repoSettings", e);
    }
  }

  public getGroupNames(): string[] {
    return _.sortBy(_.uniq(_.map(this._repoSettings, s => s.group)), s => s);
  }

  public hasFavorites(): boolean {
    return !_.find(this._repoSettings, r => r.favorite === true) === undefined;
  }

  public isFavorite(repoId: string): boolean {
    return this.getOrCreateRepoSetting(repoId).favorite;
  }

  public getGroup(repoId: string): string {
    return this.getOrCreateRepoSetting(repoId).group;
  }

  public async setFavorite(repoId: string, favorite: boolean) {
    await this.reloadRepoSettings();
    const repoSetting = this.getOrCreateRepoSetting(repoId);
    repoSetting.favorite = favorite;

    if (this.online)
      await this._extensionDataManager?.setDocument(this._repoSettingsDocuments, repoSetting);
  }

  public async setGroup(repoId: string, groupName: string) {
    await this.reloadRepoSettings();
    const repoSetting = this.getOrCreateRepoSetting(repoId);
    repoSetting.group = groupName;

    if (this.online)
      await this._extensionDataManager?.setDocument(this._repoSettingsDocuments, repoSetting);
  }

  private getOrCreateRepoSetting(repoId: string): RepoSettingsModel {
    let repoSetting = _.find(this._repoSettings, s => s.repoId === repoId);
    if (repoSetting === undefined) {
      repoSetting = { repoId: repoId } as RepoSettingsModel;
      this._repoSettings.push(repoSetting);
    }
    return repoSetting;
  }
}
