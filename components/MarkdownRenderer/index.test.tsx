/**
 * @jest-environment jsdom
 */
import { expectNoXss, toDom, xssPayloads } from "@lib/sanitize.testUtils";
import { renderToStaticMarkup } from "react-dom/server";
import rehypeRaw from "rehype-raw";

import MarkdownRenderer from ".";

const render = (markdown: string, props = {}) =>
  toDom(
    renderToStaticMarkup(
      <MarkdownRenderer {...props}>{markdown}</MarkdownRenderer>
    )
  );

describe("MarkdownRenderer", () => {
  describe("blocks script in proposal and poll text", () => {
    it.each(xssPayloads)("raw HTML: %s", (payload) => {
      expectNoXss(render(`Intro\n\n${payload}`));
    });

    it.each([
      "[click](javascript:alert(1))",
      "![img](javascript:alert(1))",
      "<javascript:alert(1)>",
    ])("markdown syntax: %s", (markdown) => {
      expectNoXss(render(markdown));
    });

    it("cannot be switched off by passing rehypePlugins", () => {
      expectNoXss(
        render('<iframe src="https://example.com"></iframe>', {
          rehypePlugins: [rehypeRaw],
        })
      );
    });
  });

  describe("keeps what proposals rely on", () => {
    it("renders http, https and mailto links", () => {
      const hrefs = [
        ...render(
          "[a](https://livepeer.org) [b](http://example.com) [c](mailto:x@y.z)"
        ).querySelectorAll("a"),
      ].map((a) => a.getAttribute("href"));
      expect(hrefs).toEqual([
        "https://livepeer.org",
        "http://example.com",
        "mailto:x@y.z",
      ]);
    });

    it("renders https images but not http ones", () => {
      const dom = render(
        "![a](https://example.com/a.png) ![b](http://example.com/b.png)"
      );
      const srcs = [...dom.querySelectorAll("img")].map((i) =>
        i.getAttribute("src")
      );
      expect(srcs).toEqual(["https://example.com/a.png"]);
    });

    it("continues numbered lists split by other content", () => {
      const dom = render("1. First\n\ntext\n\n2. Second");
      expect(dom.querySelectorAll("ol")[1]?.getAttribute("start")).toBe("2");
    });

    it("links footnote references to their notes and back", () => {
      const dom = render("Claim.[^1]\n\n[^1]: Source.");
      const ref = dom.querySelector("sup a");
      const target = ref?.getAttribute("href")?.slice(1);
      expect(target && dom.querySelector(`[id="${target}"]`)).not.toBeNull();
      const back = dom.querySelector("a[data-footnote-backref]");
      const origin = back?.getAttribute("href")?.slice(1);
      expect(origin && dom.querySelector(`[id="${origin}"]`)).toBe(ref);
    });

    it("renders tables, blockquotes, code and inline HTML", () => {
      const dom = render(
        "| a | b |\n| - | - |\n| 1 | 2 |\n\n> quote\n\n`code` and <b>bold</b> & R&D"
      );
      expect(dom.querySelectorAll("td")).toHaveLength(2);
      expect(dom.querySelector("blockquote")?.textContent).toContain("quote");
      expect(dom.querySelector("code")?.textContent).toBe("code");
      expect(dom.querySelector("b")?.textContent).toBe("bold");
      expect(dom.textContent).toContain("& R&D");
    });
  });
});
