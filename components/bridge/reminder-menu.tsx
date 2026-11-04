"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/misc";
import {
  type ClaimReminder,
  downloadClaimReminder,
  googleCalendarUrl,
} from "@/lib/bridge/reminder";

/**
 * A reminder to claim a withdrawal, in the calendar people use: Google
 * Calendar by link (an .ics file there means importing it in settings), or
 * a file Apple Calendar and Outlook open directly. `url` is filled in from
 * the page when pressed.
 */
export function ReminderMenu({
  reminder,
  compact = false,
}: {
  reminder: Omit<ClaimReminder, "url">;
  /** An icon button, for a row; otherwise a text link. */
  compact?: boolean;
}) {
  const full = () => ({ ...reminder, url: `${window.location.origin}/` });
  return (
    <Menu>
      <MenuTrigger
        render={
          compact ? (
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Add a reminder to claim"
              title="Add a reminder to claim to your calendar"
            />
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            />
          )
        }
      >
        {compact ? (
          <CalendarPlus />
        ) : (
          <>
            <CalendarPlus className="size-3" /> Add a reminder
          </>
        )}
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem
          onClick={() =>
            window.open(googleCalendarUrl(full()), "_blank", "noopener")
          }
        >
          Google Calendar
        </MenuItem>
        <MenuItem onClick={() => downloadClaimReminder(full())}>
          Apple Calendar or Outlook (.ics)
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
