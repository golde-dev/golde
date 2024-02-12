import { execSync } from "child_process";


export const getBranchName = () => execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
export const getCurrentHash = () => execSync('git rev-parse HEAD').toString().trim()
export const createBranchSlug = () => "slug"