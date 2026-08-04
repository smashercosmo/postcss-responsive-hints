import process from "node:process";

type Argv = typeof process.argv;
type Arg = Argv[number];
type KeyValueArg = `${string}=${string}`;

const KEY_VALUE_ARGUMENT_REGEX = /^([A-Za-z]\S+)=(\S+)$/;

function isKeyValueArgument(arg: Arg | KeyValueArg): arg is KeyValueArg {
  return KEY_VALUE_ARGUMENT_REGEX.test(arg);
}

export function getProcessArgvAsObject<RequiredKeys extends Array<string>>(
  args: Argv,
  requiredArgs: RequiredKeys,
) {
  const requiredArgsSet = new Set(requiredArgs);
  const keyValueTuples: [[string, string], ...Array<[string, string]>] = [
    ["nodeBinary", args[0]],
    ["scriptPath", args[1]],
  ];

  for (const [index, arg] of args.slice(2).entries()) {
    if (isKeyValueArgument(arg)) {
      const [key, value] = arg.split("=");
      if (requiredArgsSet.has(key)) {
        requiredArgsSet.delete(key);
      }
      keyValueTuples.push([key, value]);
    } else {
      keyValueTuples.push([`arg${index}`, arg]);
    }
  }

  if (requiredArgsSet.size > 0) {
    const missingArgs = [...requiredArgsSet].join(", ");
    console.error(`Required parameters "${missingArgs}" were not provided.`);
    process.exit(1);
  }

  return Object.fromEntries(keyValueTuples) as {
    [key in "nodeBinary" | "scriptPath" | RequiredKeys[number]]: string;
  };
}
