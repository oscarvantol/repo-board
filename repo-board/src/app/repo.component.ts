import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { GitPullRequest, GitRepository, GitBranchStats, PullRequestStatus } from "azure-devops-extension-api/Git";
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

    gitBranches: GitBranchStats[] = [];
    pullRequests: GitPullRequest[] = [];

    constructor(public readonly repoService: RepoService) {}

    async ngOnInit() {
        this.gitBranches = await this.repoService.getBranches(this.gitRepository);
        this.pullRequests = await this.repoService.getPullRequests(this.gitRepository);
    }

    public formatDate(jsonDate: Date) {
        const dateOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
        const dateTimeOptions = { ...timeOptions, ...dateOptions };      
        const date = new Date(parseInt(jsonDate.toString().substr(6)));
        return date.toLocaleDateString("nl-NL", dateTimeOptions);
    }

    getPullRequest(branchName: string): GitPullRequest | undefined {
        let result = this.pullRequests.find(pr => pr.sourceRefName === `refs/heads/${branchName}`);
        return result;
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

    getUrlForBranch(branchName: string): string {
        return `${this.gitRepository.webUrl}?version=GB${branchName}`;
    }

    getUrlForPullRequest(pullRequestId: number): string {
        return `${this.gitRepository.webUrl}/pullrequest/${pullRequestId}`;
    }

    getUrlNewPullRequest(branchName: string): string {
        return `${this.gitRepository.webUrl}/pullrequestcreate?sourceRef=${branchName}`;
    }
}
