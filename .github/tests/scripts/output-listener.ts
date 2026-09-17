import type { ActOutput, ActOutputListener } from "act-test-runner";

const TIDY_UP_MESSAGE_REGEX = /\s*((::\w+::\s*)(.*?))[\r|\n]{1,}/s;

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
      message: (message.match(TIDY_UP_MESSAGE_REGEX)?.[1] ?? message).trim(),
      job: job?.id,
      step: step?.name ?? step?.id,
    });
  }

  getEntries() {
    return this.entries;
  }

  clear() {
    this.entries = [];
  }
}
