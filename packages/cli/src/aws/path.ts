import { matchCloudwatchLogGroup } from "./resources/cloudwatch/logGroup/path.ts";
import { matchIAMRole } from "./resources/iam/role/path.ts";
import { matchLambdaFunction } from "./resources/lambda/function/path.ts";
import { matchS3Bucket } from "./resources/s3/bucket/path.ts";

export function matchAWSPath(path: string): [string, string, string | null] | undefined {
  if (!path.startsWith("aws.")) {
    return;
  }

  const match = matchIAMRole(path) ??
    matchS3Bucket(path) ??
    matchLambdaFunction(path) ??
    matchCloudwatchLogGroup(path);

  if (!match) {
    throw new Error(`Unable to match AWS path: ${path}`);
  }
  return match;
}
