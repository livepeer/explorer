import { renderToStaticMarkup } from "react-dom/server";

import { PlainMarkdown } from "./markdown";

const html = (source: string) =>
  renderToStaticMarkup(<PlainMarkdown source={source} />);

describe("PlainMarkdown", () => {
  it("treats <br> as spacing between blocks and a break within them", () => {
    expect(html("One\n\n<br>\n\nTwo")).toBe(html("One\n\nTwo"));
    expect(html("a<br>b")).toContain("a<br/>b");
    // An empty bold pair on its own line is spacing too, not a divider.
    expect(html("# Abstract\n****\nText")).not.toContain("<hr");
  });

  it("renders tables, with formatting in cells", () => {
    const out = html(
      "| **Track** | Owner |\n| --- | --- |\n| Build<br>Builder | Mike |"
    );
    expect(out).toContain("<th");
    expect(out).toContain("<strong");
    expect(out).toContain("Build<br/>Builder");
    expect(out).not.toContain("|");
  });

  it("keeps a row whose cell breaks across lines, or has no closing pipe", () => {
    const broken = html(
      "| A | B |\n| --- | --- |\n| one | starts here\nand ends here |\n\nAfter."
    );
    expect(broken).toContain(">starts here and ends here</td>");
    expect(broken).toContain(">After.</p>");
    const open = html("| A | B |\n| --- | --- |\n| one | two\n\nAfter.");
    expect(open).toContain(">two</td>");
    expect(open).toContain(">After.</p>");
  });

  it("renders italics without catching snake_case or a lone asterisk", () => {
    expect(html("*Elite Encoder* and _note_")).toContain(
      "<em>Elite Encoder</em>"
    );
    expect(html("*Elite Encoder* and _note_")).toContain("<em>note</em>");
    expect(html("set max_stake_amount to 2 * 3")).not.toContain("<em>");
  });

  it("drops a bold marker with no partner", () => {
    const out = html(
      "| [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen)** | Generates code |\n| --- | --- |"
    );
    expect(out).not.toContain("**");
    expect(out).toContain(">oapi-codegen</a>");
    // Paired markers still make bold, and an escaped one stays.
    expect(html("**bold** and \\*\\*")).toContain("<strong");
    expect(html("**bold** and \\*\\*")).toContain("and **");
  });

  it("reads escapes and entities", () => {
    expect(html("a \\- b \\*c\\*")).toContain("a - b *c*");
    expect(html("x&nbsp;&amp;&#39;y")).toContain("x &amp;&#x27;y");
  });

  it("links images instead of loading them", () => {
    const out = html(
      '![Roadmap](https://example.com/r.png) <img src="https://example.com/s.png" alt="State">'
    );
    expect(out).not.toContain("<img");
    expect(out).toContain('href="https://example.com/r.png"');
    expect(out).toContain("[Roadmap]");
    expect(out).toContain("[State]");
    expect(html("![Roadmap|690x486](https://example.com/r.png)")).toContain(
      "[Roadmap]"
    );
    expect(
      html("[![thumb](https://example.com/t.png)](https://youtu.be/x)")
    ).toContain('href="https://youtu.be/x"');
  });

  it("renders task lists and reference links", () => {
    const tasks = html("- [x] done\n- [ ] to do");
    expect(tasks).toContain('checked=""');
    expect(tasks).not.toContain("[x]");
    const ref = html("See [the forum][1].\n\n[1]: https://forum.livepeer.org");
    expect(ref).toContain('href="https://forum.livepeer.org"');
    expect(ref).not.toContain("[1]");
  });

  it("never passes HTML through", () => {
    const out = html("<script>alert(1)</script> [x](javascript:alert(1))");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("javascript:");
  });
});
