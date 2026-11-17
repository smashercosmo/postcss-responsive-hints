/** What a code block holds, by language, which names its "Copy" button. */
const CONTENT_NAMES: Record<string, string> = {
  console: "shell command",
  css: "CSS",
  js: "JavaScript",
  ts: "TypeScript",
};

/** U+00A0. Not read aloud, but makes a repeated message differ from the last. */
const NO_BREAK_SPACE = String.fromCodePoint(160);

const FEEDBACK_DURATION = 1500;

/** The text to copy: shell sessions without the `$ ` prompt. */
function codeToCopy(pre: HTMLElement) {
  const code = pre.querySelector("code");
  const text = code?.textContent ?? "";
  return code?.classList.contains("language-console") === true
    ? text.replaceAll(/^\$ /gmv, "")
    : text;
}

/** E.g. "CSS" for a block of `language-css`, "code" for any other. */
function contentName(pre: HTMLElement) {
  const classes = [...(pre.querySelector("code")?.classList ?? [])];
  const language = classes
    .find((className) => className.startsWith("language-"))
    ?.slice("language-".length);
  return (
    (language === undefined ? undefined : CONTENT_NAMES[language]) ?? "code"
  );
}

/**
 * VoiceOver doesn't announce a message identical to the last one of the same
 * region. A repeated message gets a no-break space, which isn't read aloud.
 */
const announced = { last: "" };

function uniqueMessage(message: string) {
  const unique =
    message === announced.last ? `${message}${NO_BREAK_SPACE}` : message;
  announced.last = unique;
  return unique;
}

/**
 * A block that scrolls horizontally can be scrolled with the keyboard only if
 * it can be focused, which Safari doesn't do by itself. Only blocks that
 * overflow become focusable, so the others aren't extra tab stops.
 */
const overflowObserver = new ResizeObserver((entries) => {
  for (const { target } of entries) {
    if (target.scrollWidth > target.clientWidth) {
      target.setAttribute("tabindex", "0");
    } else {
      target.removeAttribute("tabindex");
    }
  }
});

/**
 * Adds a "Copy" button to a code block. The button goes into a wrapper next to
 * the block, not into the block itself, which scrolls horizontally and would
 * take the button with it.
 */
function addCopyButton(pre: HTMLElement) {
  const wrapper = document.createElement("div");
  wrapper.className = "code-block";

  const copy = document.createElement("span");
  copy.className = "copy";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy__button";
  const context = document.createElement("span");
  context.className = "visually-hidden";
  context.textContent = ` ${contentName(pre)}`;
  button.append("Copy", context);

  /**
   * The message is both the visible feedback and the live region. It's outside
   * the button: the children of a button aren't reliably announced.
   */
  const status = document.createElement("span");
  status.className = "copy__status";
  status.setAttribute("role", "status");

  /** Clears the message, restarted on every click. */
  const reset: { timer?: ReturnType<typeof globalThis.setTimeout> } = {};

  function report(message: string) {
    globalThis.clearTimeout(reset.timer);
    status.textContent = "";
    button.dataset["copied"] = "";
    // Emptied and filled in separate frames, so the message is announced again
    requestAnimationFrame(() => {
      status.textContent = uniqueMessage(message);
    });
    reset.timer = globalThis.setTimeout(() => {
      status.textContent = "";
      delete button.dataset["copied"];
    }, FEEDBACK_DURATION);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeToCopy(pre));
      report("Copied");
    } catch {
      // No access to the clipboard, e.g. denied by the user
      report("Copy failed");
    }
  }

  button.addEventListener("click", () => {
    void copyCode();
  });
  copy.append(button, status);
  pre.before(wrapper);
  wrapper.append(pre, copy);

  // A block with a tabindex of its own, like the playground's output, keeps it
  if (!pre.hasAttribute("tabindex")) {
    overflowObserver.observe(pre);
  }
}

function initCodeBlocks() {
  for (const pre of document.querySelectorAll<HTMLElement>("pre:has(> code)")) {
    addCopyButton(pre);
  }
}

export { initCodeBlocks };
