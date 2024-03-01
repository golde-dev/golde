

export interface Plan {
  provider: "cloudflare" | "deployer" | "hcloud";
  type: "create" | "delete" | "update";
  path: string;
  dependencies: string[];
}