import { Injectable } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, IProjectInfo } from "azure-devops-extension-api";
import { GitRestClient, GitRepository, GitPullRequestSearchCriteria, PullRequestStatus, GitBranchStats, GitPullRequest } from "azure-devops-extension-api/Git";
import { Observable, of } from 'rxjs';

import RepositoriesJson from "../../assets/data/repositories.json";
import BranchesJson from "../../assets/data/branches.json";
import PullRequestsJson from "../../assets/data/pullrequests.json";
import { ThisReceiver } from '@angular/compiler';


@Injectable({
  providedIn: 'root'
})
export class RepoService {
  public get online() {
    return document.domain !== "localhost";
  }

  private _branches: GitBranchStats[] = [];
  private _pullRequests: GitPullRequest[] = [];
  private _gitClient?: GitRestClient;
  private _favorites: string[] = [];
  private _project: IProjectInfo | undefined;
  private _repoFavName: string = "repo-fav";
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
      gitBranches = this._branches;
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
    this._gitClient = getClient(GitRestClient);
    this._project = await projectService.getProject();
    if (this._project === undefined)
      throw ("Unable to load project");

    this._repoFavName = `repo-fav-${this._project.id}`;
    this._favorites = JSON.parse(localStorage.getItem(this._repoFavName) ?? "[]") as string[];
    const gitRepositories = await this._gitClient.getRepositories(this._project.id);
    this.gitRepositories$ = of(this.getSortedList(gitRepositories));
  }

  private async initOffline() {
    this._favorites = JSON.parse(localStorage.getItem(this._repoFavName) ?? "[]") as string[];
    const gitRepositories = RepositoriesJson as any as GitRepository[];
    this.gitRepositories$ = of(this.getSortedList(gitRepositories));

    this._branches = BranchesJson as any as GitBranchStats[];
    this._pullRequests = PullRequestsJson as any as GitPullRequest[];
  }

  private getSortedList = (repos: GitRepository[]) =>
    repos.sort((r1, r2) => {
      const [name1, name2] = [r1.name?.toLocaleLowerCase(), r2.name?.toLocaleLowerCase()];
      if (name1 > name2) return 1;
      if (name1 < name2) return -1;
      return 0;
    });

  public async toggleFavorite(repoId: string) {
    const idx = this._favorites.indexOf(repoId);

    if (idx > -1) {
      this._favorites.splice(idx, 1);
    } else {
      this._favorites.push(repoId);
    }

    localStorage.setItem(this._repoFavName, JSON.stringify(this._favorites));
  }

  public isFavorite(repoId: string) {
    return this._favorites.indexOf(repoId) > -1;
  }

  public hasFavorites(): boolean {
    return this._favorites.length > 0;
  }
}
