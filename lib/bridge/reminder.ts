/**
 * A calendar reminder to claim a withdrawal once Arbitrum's withdrawal
 * period is over. The explorer can't notify anyone a week later, so it
 * hands the date to the calendar instead: a link that opens Google
 * Calendar's new-event page filled in, or an .ics file, which Apple
 * Calendar and Outlook open directly.
 */

export type ClaimReminder = {
  /**
   * Unique to the withdrawal (its transaction), so importing twice updates
   * one event.
   */
  id: string;
  /** "250 LPT". */
  amount: string;
  /** When it becomes claimable, unix seconds. */
  at: number;
  /** Where to claim it. */
  url: string;
};

/** Half an hour, from when it becomes claimable. */
const LENGTH = 30 * 60;

const title = (amount: string) => `Claim ${amount} on Ethereum`;
const details = (url: string) =>
  `Your LPT withdrawal from Arbitrum can be claimed on Ethereum. Claim it from Pending on your Livepeer Explorer portfolio: ${url}`;

/** iCalendar's UTC form: 20261110T143000Z. */
const icsTime = (sec: number) =>
  new Date(sec * 1000).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

/** iCalendar text: backslash, semicolon, comma and newlines escaped. */
const icsText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/[;,]/g, "\\$&").replace(/\r?\n/g, "\\n");

export function claimReminder({
  id,
  amount,
  at,
  url,
  nowSec = Math.floor(Date.now() / 1000),
}: ClaimReminder & { nowSec?: number }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Livepeer Explorer//Bridge//EN",
    "BEGIN:VEVENT",
    `UID:${icsText(`claim-${id.toLowerCase()}@livepeer-explorer`)}`,
    `DTSTAMP:${icsTime(nowSec)}`,
    `DTSTART:${icsTime(at)}`,
    `DTEND:${icsTime(at + LENGTH)}`,
    `SUMMARY:${icsText(title(amount))}`,
    `DESCRIPTION:${icsText(details(url))}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Google Calendar's new-event page, filled in: Save adds it. */
export function googleCalendarUrl({ amount, at, url }: ClaimReminder) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title(amount),
    dates: `${icsTime(at)}/${icsTime(at + LENGTH)}`,
    details: details(url),
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Saves the reminder as an .ics file, for the calendar to open. */
export function downloadClaimReminder(args: ClaimReminder) {
  const blob = new Blob([claimReminder(args)], { type: "text/calendar" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "claim-lpt.ics";
  a.click();
  URL.revokeObjectURL(href);
}
