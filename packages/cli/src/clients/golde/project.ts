import { GoldeClientBase } from "./base.ts";

export class ProjectClient extends GoldeClientBase {
  /**
   * Create new project
   */
  public createProject(name: string): Promise<void> {
    return this.makeRequest("/projects", "POST", {
      name,
    });
  }

  public async uploadArtifact(
    project: string,
    key: string,
    body: Blob,
  ): Promise<void> {
    const form = new FormData();
    form.set("key", key);
    form.set("body", body);

    await this.makeFileRequest(
      `/projects/${project}/artifacts`,
      "POST",
      form,
    );
  }
}
