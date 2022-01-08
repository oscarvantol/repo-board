import { Injectable } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, IProjectInfo, IExtensionDataService, IExtensionDataManager } from "azure-devops-extension-api";
import { GitRestClient, GitRepository, GitPullRequestSearchCriteria, PullRequestStatus, GitBranchStats, GitPullRequest } from "azure-devops-extension-api/Git";


import RepositoriesJson from "../../assets/data/repositories.json";
import BranchesJson from "../../assets/data/branches.json";
import PullRequestsJson from "../../assets/data/pullrequests.json";
import { RepoSettingsModel } from '../models/repo-settings.model';
import _ from 'lodash';
import { RepoFavoriteModel } from '../models/repo-favorite.model';
import { of } from 'rxjs';


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
  private _project: IProjectInfo | undefined;
  private _user?: SDK.IUserContext;
  private _extensionDataManager?: IExtensionDataManager;

  private _testDataRepoFavoriteModels = new Map<string, RepoFavoriteModel>();
  private _testDataRepoSettingsModels = new Map<string, RepoSettingsModel>();

  constructor() {
    if (this.online)
      SDK.init();
  }

  private get repoSettingsContainerName(): string {
    return `rs-${this._project?.id}`;
  }

  private get repoFavsContainerName(): string {
    return `rf-${this._project?.id}-${this._user?.id}`;
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

  public async getPullRequests(gitRepositoryId: string) {
    var pullRequests: GitPullRequest[] = [];
    if (this.online) {
      const gitClient = getClient(GitRestClient);
      pullRequests = await gitClient.getPullRequests(gitRepositoryId, { status: PullRequestStatus.Active } as GitPullRequestSearchCriteria);
    } else {
      pullRequests = this._pullRequests.filter(pr => pr.repository.id === gitRepositoryId);
    }

    return pullRequests;
  }

  private async initOnline() {
    await SDK.ready();

    const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);

    this._gitClient = getClient(GitRestClient);
    this._project = await projectService.getProject();
    if (this._project === undefined)
      throw ("Unable to load project");

    this._user = SDK.getUser();
    await this.initDataManager();
  }

  public async getAllRepositories() {
    if (this.online)
      return (await this._gitClient?.getRepositories(this._project?.id ?? ""))?.sort();
    else
      return of(RepositoriesJson.sort() as any as GitRepository[]).toPromise();
  }

  private async initOffline() {
    this._branchesJson = BranchesJson as [];
    this._pullRequests = PullRequestsJson as any as GitPullRequest[];
  }

  private async initDataManager() {
    let dataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
    let extensionContext = SDK.getExtensionContext();
    this._extensionDataManager = await dataService.getExtensionDataManager(`${extensionContext.publisherId}.${extensionContext.extensionId}`, await SDK.getAccessToken());
  }

  public async saveRepoSetting(repoSetting: RepoSettingsModel) {
    if (this.online) {
      try {
        var current = await this._extensionDataManager?.getDocument(this.repoSettingsContainerName, repoSetting.id) as RepoSettingsModel;
        current.group = repoSetting.group;
        current.hiddenBranches = repoSetting.hiddenBranches;
        repoSetting = current;
      } catch (e) { }

      await this._extensionDataManager?.setDocument(this.repoSettingsContainerName, repoSetting);
    } else {
      this._testDataRepoSettingsModels.set(repoSetting.id ?? "", repoSetting);
    }
  }

  public async getRepoSettings(): Promise<RepoSettingsModel[]> {
    if (this.online && this._extensionDataManager) {
      try {
        return await this._extensionDataManager?.getDocuments(this.repoSettingsContainerName) ?? of([]);
      } catch (e) {
        return [];
      }
    }

    return of(Array.from(this._testDataRepoSettingsModels.values())).toPromise();
  }

  public async saveFavorite(repoFavorite: RepoFavoriteModel) {
    if (this.online) {
      try {
        var current = await this._extensionDataManager?.getDocument(this.repoFavsContainerName, repoFavorite.id, { scopeType: "User" }) as RepoFavoriteModel;
        current.isFavorite = repoFavorite.isFavorite;
        repoFavorite = current;
      }
      catch (e) { }

      await this._extensionDataManager?.setDocument(this.repoFavsContainerName, repoFavorite, { scopeType: "User" });
    } else {
      this._testDataRepoFavoriteModels.set(repoFavorite.id ?? "", repoFavorite);
    }
  }

  public async getFavorites(): Promise<RepoFavoriteModel[]> {
    if (this.online && this._extensionDataManager)
      try {
        return await this._extensionDataManager?.getDocuments(this.repoFavsContainerName, { scopeType: "User" });
      } catch (e) {
        return [];
      }

    return of(Array.from(this._testDataRepoFavoriteModels.values())).toPromise();
  }

}