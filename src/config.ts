
export type DeployConfig = Record<string, HostDeployApps>;

export type HostDeployApps = Record<string, {
  domain: string;
  fileServer?: Record<string, {
    match: string,
    root: string
  }>;
  reverseProxy?: Record<string, {
    root: string,
    match: string,
    systemdTemplate: "node-api",
    greenPorts: number[]
    bluePorts: number[]
  }>
}>;

export const exampleConfig: DeployConfig = {
  "wro-self-1-1": {
    "tech-stack-dev": {
      domain: "tech-stack-dev.tenacify.dev",
      fileServer: {
        "app": {
          match: "/app*",
          root: "./packages/app/dist",
        },
        "website": {
          match: "/",
          root: "./packages/website/dist",
        },
      },
      reverseProxy: {
        "api": {
          root: "./packages/api",
          systemdTemplate: "node-api",
          match: "/api/*",
          greenPorts: [3001, 3002, 3003, 3004],
          bluePorts: [3005, 3006, 3007, 3008],
        },
      },
    }, 
    // timers: {
    //   cleanExpired: {
    //     root: './packages/api',
    //     template: 'timer-node',
    //   }
    // }
  },
};





export default exampleConfig;