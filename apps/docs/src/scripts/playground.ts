import postcss, { CssSyntaxError } from "postcss";
import responsiveHints from "postcss-responsive-hints";

/** U+00A0. Not read aloud, but makes a repeated message differ from the last. */
const NO_BREAK_SPACE = String.fromCodePoint(160);

/** How long typing pauses before the result is announced, in ms. */
const ANNOUNCE_DELAY = 750;

interface Transformed {
  text: string;
  isError: boolean;
}

/** Reads "480px, 768px" as `["480px", "768px"]`. */
function parseBreakpoints(value: string) {
  return value
    .split(",")
    .map((breakpoint) => breakpoint.trim())
    .filter(Boolean);
}

function describeError(error: unknown) {
  if (error instanceof CssSyntaxError) {
    const location =
      error.line === undefined
        ? ""
        : ` (line ${error.line}, column ${error.column ?? 1})`;
    return `${error.reason}${location}`;
  }
  return error instanceof Error ? error.message : "Unknown error";
}

/** A field of the form, which the markup of the playground always has. */
function getField<Field extends Element>(
  form: HTMLFormElement,
  name: string,
  type: { new (): Field; prototype: Field },
) {
  const field = form.elements.namedItem(name);
  if (!(field instanceof type)) {
    throw new TypeError(`The playground has no "${name}" field`);
  }
  return field;
}

async function transform(
  css: string,
  breakpoints: string,
  comments: boolean,
): Promise<Transformed> {
  try {
    const result = await postcss([
      responsiveHints({ breakpoints: parseBreakpoints(breakpoints), comments }),
    ]).process(css, { from: undefined });
    return { text: result.css, isError: false };
  } catch (error) {
    return { text: describeError(error), isError: true };
  }
}

function initPlayground(form: HTMLFormElement) {
  const input = getField(form, "input", HTMLTextAreaElement);
  const breakpoints = getField(form, "breakpoints", HTMLInputElement);
  const comments = getField(form, "comments", HTMLInputElement);
  const output = form.querySelector("[data-output]");
  const pre = output?.parentElement;
  const status = form.querySelector("[data-status]");

  if (!output || !pre || !status) {
    throw new TypeError("The playground has no output");
  }

  /**
   * `run` is bumped on every change, so an older, slower run doesn't win.
   * `message` is the last announcement, `announcement` the pending one.
   */
  const state: {
    run: number;
    message: string;
    announcement?: ReturnType<typeof globalThis.setTimeout>;
  } = { run: 0, message: "" };

  /**
   * Announces the result once typing pauses, not on every keystroke. VoiceOver
   * skips a message identical to the last one, so a repeat gets a no-break
   * space, which isn't read aloud.
   */
  function announce(text: string, isError: boolean) {
    globalThis.clearTimeout(state.announcement);
    state.announcement = globalThis.setTimeout(() => {
      const message = isError ? `Error: ${text}` : "Output updated";
      state.message =
        message === state.message ? `${message}${NO_BREAK_SPACE}` : message;
      if (status) {
        status.textContent = state.message;
      }
    }, ANNOUNCE_DELAY);
  }

  async function update({ isInitial = false } = {}) {
    state.run += 1;
    const { run } = state;
    const { text, isError } = await transform(
      input.value,
      breakpoints.value,
      comments.checked,
    );
    if (run === state.run && output && pre) {
      output.textContent = text;
      // An error message isn't CSS, so it isn't highlighted as CSS.
      output.classList.toggle("language-css", !isError);
      pre.toggleAttribute("data-error", isError);
      output.dispatchEvent(new Event("syntax-highlight", { bubbles: true }));
      // The first output is part of the page, not a change to announce
      if (!isInitial) {
        announce(text, isError);
      }
    }
  }

  form.addEventListener("input", () => {
    void update();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  void update({ isInitial: true });
}

for (const form of document.querySelectorAll<HTMLFormElement>(
  "[data-playground]",
)) {
  initPlayground(form);
}
