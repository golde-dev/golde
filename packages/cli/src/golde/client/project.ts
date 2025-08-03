import { logger } from "../../logger.ts";
import { GoldeClientBase, GoldeError, notFoundAsUndefined } from "./base.ts";

interface Project {
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class ProjectClient extends GoldeClientBase {
  /**
   * Create new project
   */
  public async createProject(name: string): Promise<Project> {
    logger.debug({ name }, "[Golde] creating project");
    try {
      return await this.makeRequest<Project>("/projects", "POST", {
        name,
      });
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error( e.cause, "[Golde] Failed to create project");
      }
      throw e;
    }
  }

  /**
   * Get project by name
   */
  public async getProject(name: string): Promise<Project> {
    logger.debug( { name }, "[Golde] Fetching project");
    try {
      return await this.makeRequest<Project>(`/projects/${name}`, "GET");
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error(e.cause, "[Golde] Failed to get project");
      }
      throw e;
    }
  }

  /**
   * Check if project exists
   */
  public async hasProject(name: string): Promise<boolean> {
    return Boolean(
      await notFoundAsUndefined(this.makeRequest<Project>(`/projects/${name}`, "GET")),
    );
  }
}
