import { Component, Input, OnInit } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, ILocationService } from "azure-devops-extension-api";
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

    @Input('organization')
    organization: string = "dummy";

    @Input('project')
    project: string = "dummy";

    gitClient?: GitRestClient;
    gitBranches: GitBranchStats[] = [];
    pullRequests: GitPullRequest[] = [];

    async ngOnInit() {
        await SDK.ready();
        this.gitClient = getClient(GitRestClient);
        this.gitBranches = _.filter(await this.gitClient.getBranches(this.gitRepository.id), (b) => `refs/heads/${b.name}` !== this.gitRepository.defaultBranch);
        this.pullRequests = await this.gitClient.getPullRequests(this.gitRepository.id, { status: PullRequestStatus.Active } as GitPullRequestSearchCriteria);
        let locationService = await SDK.getService<ILocationService>(CommonServiceIds.LocationService);
        console.log({ getResourceAreaLocation: await locationService.getResourceAreaLocation("git") });
        this.organization = await locationService.routeUrl("", {});
    }

    getPullRequest(branchName: string): GitPullRequest | undefined {
        let result = _.find(this.pullRequests, { sourceRefName: `refs/heads/${branchName}` });
        return result;
    }

    getUrlForPullRequest(pullRequestId: number): string {
        return `${this.organization}/${this.project}/_git/${this.gitRepository.name}/pullrequest/${pullRequestId}`;
    }

    getUrlNewPullRequest(branchName: string): string {
        return `${this.organization}/${this.project}/_git/${this.gitRepository.name}/pullrequestcreate?sourceRef=refs/heads/${branchName}`;
    }

}