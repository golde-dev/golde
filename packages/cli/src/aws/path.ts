import { matchCloudwatchLogGroup } from "./resources/cloudwatchLogGroup/path.ts";
import { matchIAMRole } from "./resources/iamRole/path.ts";
import { matchLambdaFunction } from "./resources/lambdaFunction/path.ts";
import { matchS3Bucket } from "./resources/s3Bucket/path.ts";

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
