import { Component, OnInit } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, } from "azure-devops-extension-api";
import { GitRestClient, GitRepository } from "azure-devops-extension-api/Git";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'repo-board';
  gitClient?: GitRestClient;
  projectService?: IProjectPageService;
  gitRepositories: GitRepository[] = [];
  routeUrl: string = "";
  constructor() {
    SDK.init();
  }

  async ngOnInit() {
    await SDK.ready();
    const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
    this.gitClient = getClient(GitRestClient);
    const project = await projectService.getProject();
    if (project === undefined)
      throw ("Unable to load project");

    this.gitRepositories = await this.gitClient.getRepositories(project.id);
  }
}
