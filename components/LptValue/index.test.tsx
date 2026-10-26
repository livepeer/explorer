/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { Tooltip } from "radix-ui";

import LptValue from ".";

let mockIsMobile = false;
jest.mock("react-device-detect", () => ({
  get isMobile() {
    return mockIsMobile;
  },
}));

beforeEach(() => {
  mockIsMobile = false;
});

// Radix measures the trigger with an API that jsdom does not implement.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

it("reveals all decimals on keyboard focus and dismisses with Escape", () => {
  render(
    <Tooltip.Provider delayDuration={0}>
      <LptValue value="15000.123456789012345678" />
    </Tooltip.Provider>
  );
  const trigger = screen.getByRole("button", { name: "15K LPT" });
  fireEvent.focus(trigger);
  const tooltip = screen.getByRole("tooltip");
  expect(tooltip.textContent).toBe("15,000.123456789012345678 LPT");
  expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
  fireEvent.keyDown(trigger, { key: "Escape" });
  expect(document.querySelector('[role="tooltip"]')).toBeNull();
});

it("exposes tiny amounts instead of repeating the compact threshold", () => {
  render(
    <Tooltip.Provider>
      <LptValue value="0.000000000000000001" />
    </Tooltip.Provider>
  );
  fireEvent.focus(screen.getByRole("button", { name: "< 0.01 LPT" }));
  expect(screen.getByRole("tooltip").textContent).toBe(
    "0.000000000000000001 LPT"
  );
});

it("opens on tap and dismisses on a second tap on mobile", () => {
  mockIsMobile = true;
  render(<LptValue value="-15000.123456789012345678" />);
  const trigger = screen.getByRole("button", { name: "-15K LPT" });
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog").textContent).toBe(
    "-15,000.123456789012345678 LPT"
  );
  fireEvent.click(trigger);
  expect(document.querySelector('[role="dialog"]')).toBeNull();
});

it("keeps signs for rewards and avoids redundant tooltips for exact values", () => {
  const { rerender } = render(
    <Tooltip.Provider>
      <LptValue value="15000.125" options={{ forceSign: true }} />
    </Tooltip.Provider>
  );
  fireEvent.focus(screen.getByRole("button", { name: "+15K LPT" }));
  expect(screen.getByRole("tooltip").textContent).toBe("+15,000.125 LPT");
  rerender(
    <Tooltip.Provider>
      <LptValue value="0" />
    </Tooltip.Provider>
  );
  expect(screen.getByText("0 LPT")).toBeDefined();
  expect(screen.queryByRole("button")).toBeNull();
  rerender(
    <Tooltip.Provider>
      <LptValue value={null} />
    </Tooltip.Provider>
  );
  expect(screen.getByText("—")).toBeDefined();
  expect(screen.queryByRole("button")).toBeNull();
});
