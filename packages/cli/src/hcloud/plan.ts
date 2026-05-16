import { logger } from "../logger.ts";
import { isEmpty } from "../utils/object.ts";
import { PlanError, PlanErrorCode } from "../error.ts";
import { createServerDestroyPlan, createServerPlan } from "./resources/server/plan.ts";
import { createServerExecutors } from "./resources/server/executor.ts";
import { createSshKeyDestroyPlan, createSshKeyPlan } from "./resources/sshKey/plan.ts";
import { createSshKeyExecutors } from "./resources/sshKey/executor.ts";
import { createZoneDestroyPlan, createZonePlan } from "./resources/zone/plan.ts";
import { createZoneExecutors } from "./resources/zone/executor.ts";
import { createDNSDestroyPlan, createDNSPlan } from "./resources/dns/record/plan.ts";
import { createDNSExecutors } from "./resources/dns/record/executor.ts";
import type { Context } from "../types/context.ts";
import type { Plan } from "../types/plan.ts";

export async function createHCloudPlan(context: Context): Promise<Plan> {
  logger.debug("[Plan][HCloud] Creating plan");
  const {
    previousState: { hcloud: hcloudState } = {},
    config: { resources: { hcloud: hcloudConfig } = {} },
    hcloud,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(hcloudState) && isEmpty(hcloudConfig)) {
    return [];
  }

  if (!hcloud) {
    throw new PlanError(
      "HCloud provider is required when using hcloud resources, ensure that providers.hcloud is defined in config",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    server: serverConfig,
    sshKey: sshKeyConfig,
    dns: { zone: zoneConfig, record: dnsRecordConfig } = {},
  } = hcloudConfig ?? {};
  const {
    server: serverState,
    sshKey: sshKeyState,
    dns: { zone: zoneState, record: dnsRecordState } = {},
  } = hcloudState ?? {};

  if (!isEmpty(zoneState) || !isEmpty(zoneConfig)) {
    const executors = createZoneExecutors(hcloud);
    plan.push(createZonePlan(executors, zoneState, zoneConfig));
  }

  if (!isEmpty(sshKeyState) || !isEmpty(sshKeyConfig)) {
    const executors = createSshKeyExecutors(hcloud);
    plan.push(createSshKeyPlan(executors, sshKeyState, sshKeyConfig));
  }

  if (!isEmpty(serverState) || !isEmpty(serverConfig)) {
    const executors = createServerExecutors(hcloud);
    plan.push(createServerPlan(executors, serverState, serverConfig));
  }

  if (!isEmpty(dnsRecordState) || !isEmpty(dnsRecordConfig)) {
    const executors = createDNSExecutors(hcloud);
    plan.push(createDNSPlan(executors, dnsRecordState, dnsRecordConfig, zoneConfig));
  }

  return (await Promise.all(plan)).flat();
}

export async function createHCloudDestroyPlan(context: Context): Promise<Plan> {
  const {
    previousState: { hcloud: hcloudState } = {},
    hcloud,
  } = context;

  const plan: Promise<Plan>[] = [];

  if (isEmpty(hcloudState)) {
    return [];
  }

  if (!hcloud) {
    throw new PlanError(
      "HCloud provider is required when using hcloud resources, ensure that providers.hcloud is defined in config",
      PlanErrorCode.PROVIDER_MISSING,
    );
  }

  const {
    server: serverState,
    sshKey: sshKeyState,
    dns: { zone: zoneState, record: dnsRecordState } = {},
  } = hcloudState ?? {};

  // Delete order: records first (so zones aren't deleted while records exist),
  // then servers, then ssh keys, then zones.
  if (!isEmpty(dnsRecordState)) {
    const executors = createDNSExecutors(hcloud);
    plan.push(createDNSDestroyPlan(executors, dnsRecordState));
  }

  if (!isEmpty(serverState)) {
    const executors = createServerExecutors(hcloud);
    plan.push(createServerDestroyPlan(executors, serverState));
  }

  if (!isEmpty(sshKeyState)) {
    const executors = createSshKeyExecutors(hcloud);
    plan.push(createSshKeyDestroyPlan(executors, sshKeyState));
  }

  if (!isEmpty(zoneState)) {
    const executors = createZoneExecutors(hcloud);
    plan.push(createZoneDestroyPlan(executors, zoneState));
  }

  return (await Promise.all(plan)).flat();
}
