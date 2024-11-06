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
    logger.debug("[Golde] creating project", { name });
    try {
      return await this.makeRequest<Project>("/projects", "POST", {
        name,
      });
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("[Golde] Failed to create project", e.cause);
      }
      throw e;
    }
  }

  /**
   * Get project by name
   */
  public async getProject(name: string): Promise<Project> {
    logger.debug("[Golde] Fetching project", { name });
    try {
      return await this.makeRequest<Project>(`/projects/${name}`, "GET");
    } catch (e) {
      if (e instanceof GoldeError) {
        logger.error("[Golde] Failed to get project", e.cause);
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
