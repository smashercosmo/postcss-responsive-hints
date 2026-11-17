/**
 * Marks the link of the section being read with aria-current, so screen readers
 * know it too: the highlight of the table of contents is only visual. Like the
 * highlight, it follows the section that crosses a line a fifth of the way down
 * the viewport.
 */
function followSections(toc: Element) {
  const links = new Map<Element, HTMLAnchorElement>();
  for (const link of toc.querySelectorAll<HTMLAnchorElement>("a[href^='#']")) {
    const section = document
      .querySelector(`#${CSS.escape(link.hash.slice(1))}`)
      ?.closest(".doc-section");
    if (section) {
      links.set(section, link);
    }
  }

  /** The sections on the line: one, or two at the moment they swap. */
  const crossing = new Set<Element>();

  function markCurrent() {
    // The first in the order of the page
    const current = [...links.keys()].find((section) => crossing.has(section));
    for (const [section, link] of links) {
      if (section === current) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) {
          crossing.add(target);
        } else {
          crossing.delete(target);
        }
      }
      markCurrent();
    },
    // A band 1% high, a fifth of the way down
    { rootMargin: "-20% 0px -79% 0px" },
  );

  for (const section of links.keys()) {
    observer.observe(section);
  }
}

function initToc() {
  for (const toc of document.querySelectorAll(".toc")) {
    followSections(toc);
  }
}

export { initToc };
