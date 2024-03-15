

type CloudflareRegion = 
  | "apac"  /** Asia-Pacific */ 
  | "eeur"  /** Eastern Europe */ 
  | "enam"  /** Eastern North America */ 
  | "weur"  /** Western Europe */ 
  | "wnam"; /** Western North America */ 

export interface CloudflareBuckets {  
  [name: string]: {
    locationHint?: CloudflareRegion
  }
}

export interface BucketsConfig {
  cloudflare?: CloudflareBuckets
}

export interface CloudflareBucketsState {
  [name: string]: {
    locationHint?: CloudflareRegion;
  }
}

export interface BucketsState {
  cloudflare?: CloudflareBucketsState
}