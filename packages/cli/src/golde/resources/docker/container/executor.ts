import type { GoldeClient } from "@/golde/client/client.ts";

export function createDockerContainerExecutors(_golde: GoldeClient) {
}

export type Executors = ReturnType<typeof createDockerContainerExecutors>;
