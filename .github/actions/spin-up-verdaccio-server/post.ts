import { getState, info } from "@actions/core";

try {
    // If pid is negative, but not -1, sig shall be sent to all processes (excluding an unspecified set of system processes) whose process group ID is equal to the absolute value of pid,
    // and for which the process has permission to send a signal. This way we kill both `pnpm` and `verdaccio` processes.
    process.kill(-Number.parseInt(getState("pid"), 10));
    info(`Verdaccio process has been killed.`);
} catch (error) {
    info(`Verdaccio process can't be killed: ${error}`);
}