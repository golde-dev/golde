import { matchCloudwatchLogGroup } from "./resources/cloudwatch/logGroup/path.ts";
import { matchIAMRole } from "./resources/iam/role/path.ts";
import { matchLambdaFunction } from "./resources/lambda/function/path.ts";
import { matchS3Bucket } from "./resources/s3/bucket/path.ts";
import { matchS3ObjectPath } from "./resources/s3/object/path.ts";

export function matchAWSPath(path: string): [string, string, string] | undefined {
  if (!path.startsWith("aws.")) {
    return;
  }

  const match = matchIAMRole(path) ??
    matchS3Bucket(path) ??
    matchS3ObjectPath(path) ??
    matchLambdaFunction(path) ??
    matchCloudwatchLogGroup(path);

  if (!match) {
    throw new Error(`Unable to match AWS path: ${path}`);
  }
  return match;
}
