

type CloudflareRegion = 
  | "apac"  /** Asia-Pacific */ 
  | "eeur"  /** Eastern Europe */ 
  | "enam"  /** Eastern North America */ 
  | "weur"  /** Western Europe */ 
  | "wnam"  /** Western North America */ 

interface BucketConfig {
  cloudflare?: {
    [name: string]: {
      location?: CloudflareRegion
    }
  }
}