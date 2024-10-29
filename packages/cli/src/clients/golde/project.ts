import { GoldeClientBase, notFoundAsUndefined } from "./base.ts";

interface Project {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectClient extends GoldeClientBase {
  /**
   * Create new project
   */
  public createProject(name: string): Promise<Project> {
    return this.makeRequest<Project>("/projects", "POST", {
      name,
    });
  }

  /**
   * Get project by name
   */
  public getProject(name: string): Promise<Project> {
    return this.makeRequest<Project>(`/projects/${name}`, "GET");
  }

  /**
   * Check if project exists
   */
  public async hasProject(name: string): Promise<boolean> {
    return Boolean(await notFoundAsUndefined(this.getProject(name)));
  }
}
