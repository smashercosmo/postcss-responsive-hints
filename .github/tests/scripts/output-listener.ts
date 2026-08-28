import type { ActOutput, ActOutputListener } from "@pshevche/act-test-runner";

const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]|\uFE0F/u;

const STRIP_MESSAGE_TYPE_REGEX = /::\w+::(.*)/s;

export class OutputListener implements ActOutputListener {
  streamOutput: boolean | undefined = false;
  entries: { message: string; job?: string; step?: string }[] = [];

  constructor({ streamOutput }: { streamOutput?: boolean } = {}) {
    this.streamOutput = streamOutput;
  }

  onOutput(entry: ActOutput): void {
    if (this.streamOutput) console.log(entry);
    if (entry.level === "info" || !EMOJI_REGEX.test(entry.message)) return;
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
