import { memoize } from "moderndash";
import { AWSClientBase } from "./base.ts";
import {
  ChangeResourceRecordSetsCommand,
  ListHostedZonesCommand,
  Route53Client as Client,
} from "@aws-sdk/client-route-53";
import type { ListHostedZonesCommandOutput, ResourceRecordSet } from "@aws-sdk/client-route-53";

export class Route53Client extends AWSClientBase {
  private getRoute53Client = memoize(() => {
    return new Client({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  });

  private getHostedZoneIdByName = memoize(async (zoneName: string) => {
    const command = new ListHostedZonesCommand();
    const result = await this
      .getRoute53Client()
      .send<ListHostedZonesCommand, ListHostedZonesCommandOutput>(command);

    const { Id } = result.HostedZones?.find(({ Name }) => Name === zoneName) ?? {};

    if (!Id) {
      throw new Error(`Hosted zone ${zoneName} not found`);
    }

    return Id;
  });

  async createDNSRecord(hostedZoneName: string, resourceRecordSet: ResourceRecordSet) {
    const hostedZoneId = await this.getHostedZoneIdByName(hostedZoneName);
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
    await this.getRoute53Client().send(command);
  }

  async updateDNSRecord(hostedZoneName: string, resourceRecordSet: ResourceRecordSet) {
    const hostedZoneId = await this.getHostedZoneIdByName(hostedZoneName);
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
    await this.getRoute53Client().send(command);
  }

  async deleteDNSRecord(hostedZoneName: string, resourceRecordSet: ResourceRecordSet) {
    const hostedZoneId = await this.getHostedZoneIdByName(hostedZoneName);
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
    await this.getRoute53Client().send(command);
  }
}
