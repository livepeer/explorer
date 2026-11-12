/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import IdentityAvatar from ".";

jest.mock("@livepeer/design-system", () => ({
  Box: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Skeleton: () => null,
}));

const address = "0x1234567890abcdef1234567890abcdef12345678";

describe("IdentityAvatar", () => {
  beforeEach(() => {
    // jsdom has no canvas implementation; the QR code skips drawing without it.
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("hides the fallback QR code from assistive technology", () => {
    const { container } = render(
      <IdentityAvatar identity={null} address={address} />
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("img")).toBeNull();
  });
});
