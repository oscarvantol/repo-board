export class RepoSettingsModel {
    id: string | undefined;
    repoId: string = "";
    group: string = "";
    hiddenBranches: string[] = [];
}