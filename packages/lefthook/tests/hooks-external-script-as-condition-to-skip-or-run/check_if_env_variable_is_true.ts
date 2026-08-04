import { getProcessArgvAsObject } from "@root/shared";
import fs from "node:fs";
import process from "node:process";

const { env_file_path, env_variable_name } = getProcessArgvAsObject(
  process.argv,
  ["env_file_path", "env_variable_name"] as const,
);

const envConfig: Record<string, string> = Object.fromEntries(
  fs
    .readFileSync(env_file_path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(line => line.split("=")),
);

if (envConfig[env_variable_name] === "true") {
  process.exit(0);
} else {
  process.exit(1);
}
