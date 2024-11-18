import { matchCloudwatchLogGroup } from "./cloudwatchLogGroup/path.ts";
import { matchIAMRole } from "./iamRole/path.ts";
import { matchLambdaFunction } from "./lambdaFunction/path.ts";
import { matchS3Bucket } from "./s3Bucket/path.ts";

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
