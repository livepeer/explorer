import { useEffect, useMemo, useState } from "react";

type Event = {
  __typename: string;
  transaction?: {
    timestamp?: number;
  };
};

// Event type labels mapping
export const EVENT_TYPE_LABELS: Record<string, string> = {
  BondEvent: "Bonded",
  DepositFundedEvent: "Deposit Funded",
  NewRoundEvent: "Initialize Round",
  RebondEvent: "Rebond",
  UnbondEvent: "Unbond",
  RewardEvent: "Reward",
  TranscoderUpdateEvent: "Transcoder Update",
  WithdrawStakeEvent: "Withdraw Stake",
  WithdrawFeesEvent: "Withdraw Fees",
  WinningTicketRedeemedEvent: "Winning Ticket Redeemed",
  ReserveFundedEvent: "Reserve Funded",
};

// All available event types
export const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);

export const useHistoryFilter = (mergedEvents: Event[]) => {
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.length === 0) {
      return mergedEvents;
    }
    return mergedEvents.filter((event) =>
      selectedEventTypes.includes(event?.__typename)
    );
  }, [mergedEvents, selectedEventTypes]);

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((type) => type !== eventType)
        : [...prev, eventType]
    );
  };

  const clearFilters = () => {
    setSelectedEventTypes([]);
  };

  // Close filter when scrolling outside the filter area (page scroll)
  useEffect(() => {
    if (!isFilterOpen) return;

    const handleScroll = (event: globalThis.Event) => {
      // Find the popover element by data attribute
      const popoverElement = document.querySelector(
        "[data-history-filter-popover]"
      );

      if (!popoverElement) {
        // Popover not found, close it
        setIsFilterOpen(false);
        return;
      }

      // Use composedPath to check if the scroll event originated from within the popover
      const path = event.composedPath();
      const isScrollingInsidePopover = path.some(
        (el) =>
          el === popoverElement ||
          (el instanceof Node && popoverElement.contains(el))
      );

      if (isScrollingInsidePopover) {
        // Scrolling inside popover, don't close
        return;
      }

      // Scrolling outside popover, close it
      setIsFilterOpen(false);
    };

    // Listen to scroll events on document (captures all scroll events)
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isFilterOpen]);

  return {
    filteredEvents,
    selectedEventTypes,
    toggleEventType,
    clearFilters,
    isFilterOpen,
    setIsFilterOpen,
    allEventTypes: ALL_EVENT_TYPES,
    eventTypeLabels: EVENT_TYPE_LABELS,
  };
};
