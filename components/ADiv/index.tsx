/**
 * @file Small wrapper around the Livepeer Design System's Link component to make it
 * compatible with the new Link component behavior in Next.js 13+.
 * TODO: Can be removed once fixed in https://github.com/livepeer/design-system.
 */
import React from "react";
import { Link as A } from "@livepeer/design-system";

/**
 * ADiv component that renders a div element styled as a design-system Link.
 * This is a workaround for compatibility with Next.js 13+ Link component behavior.
 */
export const ADiv = (props: any) => <A as="div" {...props} />;
