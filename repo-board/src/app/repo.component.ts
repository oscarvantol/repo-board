import { Component, Input, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { GitPullRequest, GitRepository, GitBranchStats, PullRequestStatus } from "azure-devops-extension-api/Git";
import { Observable, of } from 'rxjs';
import { RepoSettingsModel } from './models/repo-settings.model';
import { RepoStateActions } from './repo-state.actions';
import { RepoState } from './repo.state';
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
    public groupName: string = "";
    public isFavorite: boolean = false;
    public hiddenBranches: string[] = [];
    public editGroup: boolean = false;

    constructor(public readonly repoService: RepoService, private store: Store) {

    }

    async ngOnInit() {
        this.store.select(RepoState.setting(this.gitRepository.id))
            .subscribe(setting => {
                this.groupName = setting?.group;
                this.hiddenBranches = setting?.hiddenBranches ?? [];
            });

        this.store.select(RepoState.favorite(this.gitRepository.id))
            .subscribe(favorite => {
                this.isFavorite = !!favorite?.isFavorite;
            });

        // this.hiddenBranches = this.repoService.getHiddenBranches(this.gitRepository.id) ?? [];
        // this.groupName = this.repoService.getGroup(this.gitRepository.id);

        this.gitBranches = (await this.repoService.getBranches(this.gitRepository));//.filter((b)=> this.hiddenBranches.indexOf(b.name) === -1);
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

    public async toggleFavorite() {
        //await this.repoService.setFavorite(repoId, !this.isFavorite);
        this.isFavorite = !this.isFavorite;
    }

    public saveGroupName() {
        this.store.dispatch(new RepoStateActions.SetGroupName(this.gitRepository.id, this.groupName));

        this.editGroup = false;
        //this.repoService.setGroup(this.gitRepository.id, this.groupName);
    }

    public async hideBranch(branchName: string) {
        await this.repoService.hideBranch(this.gitRepository.id, branchName);
        this.ngOnInit();
    }
}
