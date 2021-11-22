
export namespace RepoStateActions {

    export class Initialize {
        static readonly type = `[RepoStateActions] Initialize`;
    }

    export class SetGroupName {
        static readonly type = `[RepoStateActions] SetGroupName`;
        constructor(public repositoryId: string, public groupName: string) {

        }

    }
}