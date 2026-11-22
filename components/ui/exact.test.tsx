/** @jest-environment jsdom */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { Exact } from "./exact";

// Floating UI asks whether the popup is in the top layer while placing it.
// jsdom's selector engine answers `:modal` and `:popover-open` by recursing
// until the stack overflows, taking seconds each time. Nothing here is
// either.
const matches = Element.prototype.matches;
beforeAll(() => {
  Element.prototype.matches = function (selector: string) {
    if (selector === ":modal" || selector === ":popover-open") return false;
    return matches.call(this, selector);
  };
  // jsdom has no PointerEvent, so a tap couldn't say it's a touch.
  window.PointerEvent ??= class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerType = init.pointerType ?? "";
    }
  } as typeof PointerEvent;
});
afterAll(() => {
  Element.prototype.matches = matches;
});

const VALUE = "152,374.019283746501928374 LPT";

/** The open popup, checking it describes itself with the exact figure. */
function popup() {
  const dialog = screen.getByRole("dialog", { name: "Exact amount" });
  const description = document.getElementById(
    dialog.getAttribute("aria-describedby") ?? ""
  );
  expect(description?.textContent).toBe(VALUE);
  return dialog;
}

describe("Exact", () => {
  it("opens on a tap, focused, and hands focus back on Escape", async () => {
    render(<Exact value={VALUE}>152,374 LPT</Exact>);
    const trigger = screen.getByRole("button", { name: "152,374 LPT" });

    fireEvent.pointerDown(trigger, { pointerType: "touch" });
    fireEvent.pointerUp(trigger, { pointerType: "touch" });
    fireEvent.click(trigger, { detail: 1 });
    const dialog = popup();
    await waitFor(() => expect(document.activeElement).toBe(dialog));

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("opens on hover without taking focus", () => {
    jest.useFakeTimers();
    try {
      render(<Exact value={VALUE}>152,374 LPT</Exact>);
      const trigger = screen.getByRole("button", { name: "152,374 LPT" });

      fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
      fireEvent.mouseEnter(trigger);
      fireEvent.mouseMove(trigger);
      act(() => jest.advanceTimersByTime(300));
      popup();
      expect(document.activeElement).toBe(document.body);

      fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
      fireEvent.mouseLeave(trigger);
      act(() => jest.advanceTimersByTime(300));
      expect(screen.queryByRole("dialog")).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it("is just the figure when rounding hid nothing", () => {
    render(<Exact value={null}>15,000 LPT</Exact>);
    expect(screen.getByText("15,000 LPT")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
