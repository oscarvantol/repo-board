import { Component, Input, OnInit } from '@angular/core';
import { GitPullRequest, GitRepository, GitBranchStats, PullRequestStatus } from "azure-devops-extension-api/Git";
import { StorageHelper } from './helpers/storageHelper';
import { RepoService } from './services/repo.service';



@Component({
    selector: 'git-repo',
    templateUrl: './repo.component.html',
    styleUrls: ['./repo.component.scss']
})
export class RepoComponent implements OnInit {
    @Input('git-repository')
    gitRepository: GitRepository = {
        name: "ovt-repo-board",
        defaultBranch: "main"
    } as GitRepository;

    public gitBranches: GitBranchStats[] = [];
    public pullRequests: GitPullRequest[] = [];

    public readonly StorageHelper = StorageHelper;

    constructor(public readonly repoService: RepoService) {
    }

    async ngOnInit() {
        this.gitBranches = await this.repoService.getBranches(this.gitRepository);
        this.pullRequests = await this.repoService.getPullRequests(this.gitRepository);
    }

    getPullRequest(branchName: string) {
        return this.pullRequests.find(pr => pr.sourceRefName === `refs/heads/${branchName}`);
    }

    getStatus(status: PullRequestStatus) {
        switch (status) {
            case PullRequestStatus.Abandoned: return "Abandoned";
            case PullRequestStatus.Active: return "Active";
            // case PullRequestStatus.All: return "All";
            case PullRequestStatus.Completed: return "Completed";
            // case PullRequestStatus.NotSet: return "NotSet";
        }
        return "";
    }

    getUrlForBranch(branchName: string) {
        return `${this.gitRepository.webUrl}?version=GB${branchName}`;
    }

    getUrlForPullRequest(pullRequestId: number) {
        return `${this.gitRepository.webUrl}/pullrequest/${pullRequestId}`;
    }

    getUrlNewPullRequest(branchName: string) {
        return `${this.gitRepository.webUrl}/pullrequestcreate?sourceRef=${branchName}`;
    }

    public toggleFavorite = (repoId: string) =>
        this.repoService.toggleFavorite(repoId);
    
    public isFavorite = (repoId: string) =>
        this.repoService.isFavorite(repoId);
}
