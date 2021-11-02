import { Component, Input, OnInit } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { GitRestClient, PullRequestStatus, GitPullRequest, GitRepository, GitBranchStats, GitPullRequestSearchCriteria } from "azure-devops-extension-api/Git";
import * as _ from 'lodash';


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

    gitClient?: GitRestClient;
    gitBranches: GitBranchStats[] = [];
    pullRequests: GitPullRequest[] = [];

    async ngOnInit() {
        await SDK.ready();
        this.gitClient = getClient(GitRestClient);
        this.gitBranches = _.filter(await this.gitClient.getBranches(this.gitRepository.id), (b) => `refs/heads/${b.name}` !== this.gitRepository.defaultBranch);
        this.pullRequests = await this.gitClient.getPullRequests(this.gitRepository.id, { status: PullRequestStatus.Active } as GitPullRequestSearchCriteria);
    }

    getPullRequest(branchName: string): GitPullRequest | undefined {
        let result = _.find(this.pullRequests, { sourceRefName: `refs/heads/${branchName}` });
        return result;
    }

    getUrlForBranch(): string {
        return this.gitRepository.webUrl;
    }

    getUrlForPullRequest(pullRequestId: number): string {
        return `${this.gitRepository.webUrl}/pullrequest/${pullRequestId}`;
    }

    getUrlNewPullRequest(branchName: string): string {
        return `${this.gitRepository.webUrl}/pullrequestcreate?sourceRef=${branchName}`;
    }

}