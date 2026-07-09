export type HookEvent =
  | "success"
  | "failure"
  | "changed"
  | "unchanged"
  | "destroy"
  | "prune";

export interface HookActionBase {
  branch?: string;
  branchPattern?: string;
}

export interface DiscordActionConfig {
  webhook: string;
  message: string;
}

export interface DiscordAction extends HookActionBase {
  discord: DiscordActionConfig;
}

export interface SlackActionConfig {
  channel: string;
  text: string;
}

export interface SlackAction extends HookActionBase {
  slack: SlackActionConfig;
}

export interface WebhookActionConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface WebhookAction extends HookActionBase {
  webhook: WebhookActionConfig;
}

export type HookAction = DiscordAction | SlackAction | WebhookAction;

export type On = Partial<Record<HookEvent, HookAction[]>>;

export interface RunInfo {
  status: "success" | "failure";
  command: "apply" | "destroy" | "prune";
  duration: string;
  changes: string;
  error?: string;
}
