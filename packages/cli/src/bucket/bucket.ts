

type CloudflareRegion = 
  | "apac"  /** Asia-Pacific */ 
  | "eeur"  /** Eastern Europe */ 
  | "enam"  /** Eastern North America */ 
  | "weur"  /** Western Europe */ 
  | "wnam";  /** Western North America */ 

export interface BucketConfig {
  cloudflare?: {
    [name: string]: {
      location?: CloudflareRegion
    }
  }
}