import type { ActOutput, ActOutputListener } from "act-test-runner";

const STRIP_MESSAGE_TYPE_REGEX = /::\w+::(.*)/s;

export class OutputListener implements ActOutputListener {
  streamOutput: boolean | undefined = false;
  entries: Array<{
    message: string;
    job?: string;
    step?: string;
  }> = [];
  filter?: (entry: ActOutput) => boolean;

  constructor({
    streamOutput,
    filter,
  }: {
    streamOutput?: boolean;
    filter?: (entry: ActOutput) => boolean;
  }) {
    this.streamOutput = streamOutput;
    this.filter = filter;
  }

  onOutput(entry: ActOutput): void {
    if (this.streamOutput) console.log(entry);
    if (typeof this.filter === "function" && !this.filter(entry)) return;
    const { message, job, step } = entry;
    this.entries.push({
      message: (message.match(STRIP_MESSAGE_TYPE_REGEX)?.[1] ?? message).trim(),
      job: job?.id,
      step: step?.name ?? step?.id,
    });
  }

  clear() {
    this.entries = [];
  }
}
