/**
 * @jest-environment jsdom
 */
import SafeHtml from "@components/SafeHtml";
import { renderToStaticMarkup } from "react-dom/server";

import { ensDescriptionSchema, sanitizeHtml } from "./sanitize";
import { expectNoXss, toDom, xssPayloads } from "./sanitize.testUtils";

// ENS descriptions are sanitized on the server (API) and again when rendered.
describe.each([
  [
    "API (sanitizeHtml)",
    (html: string) => sanitizeHtml(html, ensDescriptionSchema),
  ],
  [
    "Profile (SafeHtml)",
    (html: string) =>
      renderToStaticMarkup(
        <SafeHtml html={html} schema={ensDescriptionSchema} />
      ),
  ],
])("ENS description via %s", (_, render) => {
  it.each(xssPayloads)("renders nothing executable for %s", (payload) => {
    expectNoXss(toDom(render(`ok ${payload}`)));
  });

  it("keeps the formatting orchestrators use", () => {
    const dom = toDom(
      render(
        '<h2>Title</h2><p><b>Fast</b> and <i>cheap</i><br>transcoding</p><ul><li>EU</li></ul><a href="https://example.com">site</a>'
      )
    );
    expect(dom.querySelector("h2")?.textContent).toBe("Title");
    expect(dom.querySelector("b")?.textContent).toBe("Fast");
    expect(dom.querySelector("i")).not.toBeNull();
    expect(dom.querySelector("br")).not.toBeNull();
    expect(dom.querySelector("li")?.textContent).toBe("EU");
    expect(dom.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com"
    );
  });

  it("drops images, keeping descriptions text-only", () => {
    expect(
      toDom(render('<img src="https://example.com/a.png">')).querySelector(
        "img"
      )
    ).toBeNull();
  });
});
