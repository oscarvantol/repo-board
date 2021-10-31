import { Component, OnInit } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";
import { GitRestClient, PullRequestStatus, GitRepository, GitBranchStats, GitPullRequestSearchCriteria } from "azure-devops-extension-api/Git";
import { GitRepoModel } from './git-repo-model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'repo-board';
  gitClient?: GitRestClient;
  projectService?: IProjectPageService;
  repos: GitRepoModel[] = [];

  constructor() {
    SDK.init();
  }

  async ngOnInit() {
    await SDK.ready();
    this.projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
    this.gitClient = getClient(GitRestClient);
    this.initialize();
  }

  async initialize() {
    if (!this.projectService || !this.gitClient) {
      throw ("not initialized");
    }

    const project = await this.projectService.getProject();
    const repos = await this.gitClient.getRepositories(project?.id);

    for (let i = 0; i < repos.length; i++) {
      this.repos.push(await this.getRepo(repos[i]));
    }
  }

  async getRepo(gitRepository: GitRepository): Promise<GitRepoModel> {
    if (!this.gitClient) {
      throw ("not initialized");
    }

    const repo = new GitRepoModel(gitRepository);
    if (repo.gitRepository.size === 0)
      return repo;

    try {
      repo.branches = await this.gitClient.getBranches(gitRepository.id);

      if (repo.branches?.length > 1) {
        repo.pullRequests = await this.gitClient.getPullRequests(gitRepository.id, { status: PullRequestStatus.Active } as GitPullRequestSearchCriteria);
        
      }
    } catch (e) {
      console.error(e);
    }

    return repo;
  }

}
