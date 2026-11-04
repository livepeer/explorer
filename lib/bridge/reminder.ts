/**
 * A calendar reminder to claim a withdrawal once Arbitrum's withdrawal
 * period is over. The explorer can't notify anyone a week later, so it
 * hands the date to the calendar instead: an .ics file, which Apple,
 * Google and Outlook calendars all import.
 */

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
}: {
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
  nowSec?: number;
}) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Livepeer Explorer//Bridge//EN",
    "BEGIN:VEVENT",
    `UID:${icsText(`claim-${id.toLowerCase()}@livepeer-explorer`)}`,
    `DTSTAMP:${icsTime(nowSec)}`,
    `DTSTART:${icsTime(at)}`,
    `DTEND:${icsTime(at + 30 * 60)}`,
    `SUMMARY:${icsText(`Claim ${amount} on Ethereum`)}`,
    `DESCRIPTION:${icsText(
      `Your LPT withdrawal from Arbitrum can be claimed on Ethereum. Claim it from Pending on your Livepeer Explorer portfolio: ${url}`
    )}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Saves the reminder, for the calendar to open. */
export function downloadClaimReminder(
  args: Parameters<typeof claimReminder>[0]
) {
  const blob = new Blob([claimReminder(args)], { type: "text/calendar" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "claim-lpt.ics";
  a.click();
  URL.revokeObjectURL(href);
}
