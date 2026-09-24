import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema, type Options } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

/** Elements removed together with their content, not just unwrapped. */
const strip = ["script", "style", "textarea", "option", "noscript"];

/**
 * Allow-list for ENS profile descriptions: basic formatting and links only.
 * Anything not listed is dropped.
 */
export const ensDescriptionSchema: Options = {
  ...defaultSchema,
  tagNames: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "div",
    "hr",
    "li",
    "ol",
    "p",
    "pre",
    "ul",
    "br",
    "code",
    "span",
  ],
  attributes: {
    a: ["href"],
  },
  protocols: {
    href: ["https", "mailto", "tel"],
  },
  strip,
};

/**
 * Allow-list for markdown content (poll and treasury proposals), applied to
 * the rendered HTML tree, so it covers markdown syntax as well as raw HTML.
 */
export const markdownSchema: Options = {
  ...defaultSchema,
  tagNames: [
    ...(ensDescriptionSchema.tagNames ?? []),
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "blockquote",
    "del",
    "input",
    // GFM footnotes.
    "sup",
    "section",
  ],
  attributes: {
    a: [
      "href",
      "target",
      "rel",
      // GFM footnote references and back-links.
      ["id", /^user-content-fnref-/],
      ["ariaDescribedBy", "footnote-label"],
      "ariaLabel",
      "dataFootnoteRef",
      "dataFootnoteBackref",
      ["className", "data-footnote-backref"],
    ],
    img: ["src", "alt", "title"],
    code: [["className", /^language-./]],
    ol: ["start"],
    li: [["id", /^user-content-fn-/]],
    h2: [
      ["id", "footnote-label"],
      ["className", "sr-only"],
    ],
    section: ["dataFootnotes", ["className", "footnotes"]],
    th: ["align"],
    td: ["align"],
    // GFM task list checkboxes.
    input: [["type", "checkbox"], ["disabled", true], "checked"],
  },
  // remark-rehype already prefixes footnote ids with `user-content-`, and the
  // `id` values above only accept those, so user HTML can't clobber page ids.
  clobberPrefix: "",
  protocols: {
    href: ["http", "https", "mailto"],
    // No plain-http images: they would be mixed content on our https pages.
    src: ["https"],
  },
  strip,
};

/**
 * Sanitize an untrusted HTML string against a schema.
 *
 * @param html - The untrusted HTML.
 * @param schema - The allow-list to apply.
 * @returns The sanitized HTML.
 */
export const sanitizeHtml = (html: string, schema: Options): string =>
  String(
    unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeSanitize, schema)
      .use(rehypeStringify)
      .processSync(html)
  );
