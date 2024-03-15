import type { BucketsState } from "../buckets/types";
import type { DNSState } from "../dns/types";

export interface State {
  dns?: DNSState
  buckets?: BucketsState
}