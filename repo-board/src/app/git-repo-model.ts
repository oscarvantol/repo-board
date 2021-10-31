import { GitRepository, GitBranchStats, GitPullRequest } from "azure-devops-extension-api/Git";

export class GitRepoModel {
    branches: GitBranchStats[] = [];
    pullRequests: GitPullRequest[] = [];

    constructor(public gitRepository: GitRepository){

    }
}