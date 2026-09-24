/** HTML payloads that must never render anything executable. */
export const xssPayloads = [
  "<script>alert(1)</script>",
  '<img src="x" onerror="alert(1)">',
  '<a href="javascript:alert(1)">x</a>',
  '<a href="data:text/html,<script>alert(1)</script>">x</a>',
  '<iframe src="https://example.com"></iframe>',
  '<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>',
  "<textarea/><img src=x onerror=alert(1)>",
  '<b onclick="alert(1)" style="position:fixed">x</b>',
];

/** Parse an HTML string into a detached container for DOM assertions. */
export const toDom = (html: string): HTMLElement => {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
};

/** Assert the rendered DOM contains nothing that can run script. */
export const expectNoXss = (container: HTMLElement) => {
  expect(
    container.querySelector("script, iframe, svg, style, object, embed")
  ).toBeNull();
  for (const el of container.querySelectorAll("*")) {
    for (const { name, value } of el.attributes) {
      expect(name).not.toMatch(/^on/i);
      expect(name).not.toBe("style");
      if (name === "href" || name === "src") {
        expect(value).not.toMatch(/^\s*(javascript|data|vbscript):/i);
      }
    }
  }
};
