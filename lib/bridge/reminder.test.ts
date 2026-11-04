import { claimReminder, googleCalendarUrl } from "./reminder";

describe("claimReminder", () => {
  const ics = claimReminder({
    id: "7704",
    amount: "1,250 LPT",
    at: 1_794_000_000,
    url: "https://explorer.livepeer.org/",
    nowSec: 1_793_400_000,
  });
  const lines = ics.split("\r\n");

  it("is one event at the claim time, half an hour long", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("DTSTART:20261106T212000Z");
    expect(lines).toContain("DTEND:20261106T215000Z");
    expect(lines.filter((l) => l === "BEGIN:VEVENT")).toHaveLength(1);
  });

  it("keys the event by the withdrawal, so importing again updates it", () => {
    expect(lines).toContain("UID:claim-7704@livepeer-explorer");
  });

  it("escapes text as iCalendar requires", () => {
    expect(lines).toContain("SUMMARY:Claim 1\\,250 LPT on Ethereum");
  });

  it("ends lines with CRLF", () => {
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
});

describe("googleCalendarUrl", () => {
  const url = new URL(
    googleCalendarUrl({
      id: "0xabc",
      amount: "1,250 LPT",
      at: 1_794_000_000,
      url: "https://explorer.livepeer.org/",
    })
  );

  it("opens Google Calendar's new-event page", () => {
    expect(url.origin + url.pathname).toBe(
      "https://calendar.google.com/calendar/render"
    );
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("fills in the same event as the .ics", () => {
    expect(url.searchParams.get("text")).toBe("Claim 1,250 LPT on Ethereum");
    expect(url.searchParams.get("dates")).toBe(
      "20261106T212000Z/20261106T215000Z"
    );
    expect(url.searchParams.get("details")).toContain(
      "https://explorer.livepeer.org/"
    );
  });
});
