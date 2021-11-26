
export namespace RepoStateActions {

    export class Initialize {
        static readonly type = `[RepoStateActions] Initialize`;
    }

    export class SetView {
        static readonly type = `[RepoStateActions] SetView`
        constructor(public view: "all" | "favorites" | string) {
        }
    }

    export class SetGroupName {
        static readonly type = `[RepoStateActions] SetGroupName`;
        constructor(public repositoryId: string, public groupName: string) {
        }
    }

    export class SetFavorite {
        static readonly type = `[RepoStateActions] SetFavorite`;
        constructor(public repositoryId: string, public isFavorite: boolean) {
        }
    }

}