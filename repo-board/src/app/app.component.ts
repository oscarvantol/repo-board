import { Component, OnInit } from '@angular/core';
import { GitRepository } from 'azure-devops-extension-api/Git';
import { Observable, of } from 'rxjs';
import { RepoService } from './services/repo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'repo-board';
  // routeUrl: string = "";

  public gitRepositories$: Observable<GitRepository[]> = of([]);

  constructor(private readonly repoService: RepoService) {
  }

  async ngOnInit() {
    await this.repoService.initialize();
    this.gitRepositories$ = this.repoService.gitRepositories$;
  }
}
