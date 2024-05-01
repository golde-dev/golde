import type { BucketsState } from "../buckets/types.ts";
import type { DNSState } from "../dns/types.ts";

export interface State {
  dns?: DNSState;
  buckets?: BucketsState;
}
