import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import React, { useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { type Options } from "rehype-sanitize";
import { unified } from "unified";

type SafeHtmlProps = {
  html: string;
  schema: Options;
};

/**
 * Render an HTML string as React elements, sanitized against a schema.
 * React builds the elements from the parsed tree, so the string is never
 * injected with `dangerouslySetInnerHTML`.
 */
const SafeHtml = ({ html, schema }: SafeHtmlProps) =>
  useMemo(() => {
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(rehypeSanitize, schema);
    const tree = processor.runSync(processor.parse(html));
    return toJsxRuntime(tree, { Fragment, jsx, jsxs });
  }, [html, schema]);

export default React.memo(SafeHtml);
