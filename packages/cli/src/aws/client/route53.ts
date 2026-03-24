import { logger } from "../../logger.ts";
import { memoize } from "@es-toolkit/es-toolkit";
import { AWSClientBase } from "./base.ts";
import {
  ChangeResourceRecordSetsCommand,
  ListHostedZonesCommand,
  Route53Client as Client,
} from "@aws-sdk/client-route-53";
import type {
  ListHostedZonesCommandInput,
  ListHostedZonesCommandOutput,
  ResourceRecordSet,
} from "@aws-sdk/client-route-53";

const clients = new Map<string, Client>();

export class Route53Client extends AWSClientBase {
  private getRoute53Client(region: string) {
    if (!clients.has(region)) {
      clients.set(
        region,
        new Client({
          region,
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          },
        }),
      );
    }
    return clients.get(region)!;
  }

  private getHostedZoneIdByName = memoize(async (region: string, zoneName: string) => {
    const command = new ListHostedZonesCommand();
    const result = await this
      .getRoute53Client(region)
      .send<ListHostedZonesCommandInput, ListHostedZonesCommandOutput>(command);

    const Id = result.HostedZones?.find(({ Name }) => Name === zoneName)?.Id;
    if (!Id) {
      throw new Error(`AWS hosted zone ${zoneName} not found`);
    }
    return Id;
  });

  async createDNSRecord(
    region: string,
    hostedZoneName: string,
    resourceRecordSet: ResourceRecordSet,
  ) {
    const hostedZoneId = await this.getHostedZoneIdByName(region, hostedZoneName);
    logger.debug({
      region,
      hostedZoneName,
      hostedZoneId,
      resourceRecordSet,
    }, "[AWS] creating DNS record");
    try {
      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: "CREATE",
              ResourceRecordSet: resourceRecordSet,
            },
          ],
        },
      });
      await this.getRoute53Client(region).send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to create DNS record");
      }
      throw e;
    }
  }

  async updateDNSRecord(
    region: string,
    hostedZoneName: string,
    resourceRecordSet: ResourceRecordSet,
  ) {
    const hostedZoneId = await this.getHostedZoneIdByName(region, hostedZoneName);
    logger.debug({
      region,
      hostedZoneName,
      hostedZoneId,
      resourceRecordSet,
    }, "[AWS] Updating DNS record");
    try {
      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: "UPSERT",
              ResourceRecordSet: resourceRecordSet,
            },
          ],
        },
      });
      await this.getRoute53Client(region).send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to update DNS record");
      }
      throw e;
    }
  }

  async deleteDNSRecord(
    region: string,
    hostedZoneName: string,
    resourceRecordSet: ResourceRecordSet,
  ) {
    const hostedZoneId = await this.getHostedZoneIdByName(region, hostedZoneName);
    logger.debug({
      region,
      hostedZoneName,
      hostedZoneId,
      resourceRecordSet,
    }, "[AWS] Deleting DNS record");
    try {
      const command = new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: "DELETE",
              ResourceRecordSet: resourceRecordSet,
            },
          ],
        },
      });
      await this.getRoute53Client(region).send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to delete DNS record");
      }
      throw e;
    }
  }
}
