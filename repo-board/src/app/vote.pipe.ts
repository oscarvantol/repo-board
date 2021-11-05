import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'vote' })
export class VotePipe implements PipeTransform {
    transform(vote: number): string {
        switch (vote) {
            case 10:
                return "ms-Icon--Approved";
            case 5:
                return "ms-Icon--ApprovedWithSuggestions";
            case -10:
                return "ms-Icon--Rejected";
            case -5:
                return "ms-Icon--WaitingForAuthor";
            default:
                return "ms-Icon--NoResponse";
        }
    }
}