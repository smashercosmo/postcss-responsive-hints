import child_process from "node:child_process";
import process from "node:process";

export function common(cmd: "add" | "remove") {
  const [pkg, options] = process.argv.slice(2);

  const commands = new Set(["add", "remove"]);
  const usage = `Usage: pnpm deps <add|remove> <package> <root|workspace>:<catalog>[:dev]`;

  if (!commands.has(cmd) || !pkg || !options) {
    console.error(usage);
    process.exit(1);
  }

  const parts = options.split(":");
  const [target, dev, catalog] = parts;

  if (parts.length === 0 || parts.length > 3) {
    console.error(
      `Only one, two or three options are allowed. Got ${options.length}: ${parts.join(",")}`,
    );
    process.exit(1);
  }

  if (!target) {
    console.error(
      "Missing target. Should be either `root` or one of the workspace packages.",
    );
    process.exit(1);
  }

  if (!catalog) {
    console.error(
      "Missing catalog name. Check pnpm-workspaces.yaml for the catalogs names or create a new one.",
    );
    process.exit(1);
  }

  const args = [
    cmd,
    pkg,
    ...(target === "root"
      ? ["--ignore-workspace-root-check"]
      : ["--filter", target]),
    ...(dev ? ["--save-dev"] : []),
    ...(cmd === "add" ? ["--save-exact"] : []),
    ...(cmd === "add" && catalog ? ["--save-catalog-name", catalog] : []),
  ];

  const result = child_process.spawnSync("pnpm", args, { stdio: "inherit" });
  process.exit(result.status ?? 1);
}
