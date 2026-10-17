import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";

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
  RewardCallerSetEvent: "Reward Caller Set",
  TranscoderUpdateEvent: "Transcoder Update",
  WithdrawStakeEvent: "Withdraw Stake",
  WithdrawFeesEvent: "Withdraw Fees",
  WinningTicketRedeemedEvent: "Winning Ticket Redeemed",
  ReserveFundedEvent: "Reserve Funded",
  VoteEvent: "Poll Vote",
  TreasuryVoteEvent: "Treasury Vote",
};

// All available event types
export const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);

export const useHistoryFilter = (mergedEvents: Event[]) => {
  const router = useRouter();
  const urlEventTypes = useMemo(() => {
    const values = router.query.eventTypes;
    const types = (Array.isArray(values) ? values : [values ?? ""])
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter((value) => ALL_EVENT_TYPES.includes(value));
    return [...new Set(types)];
  }, [router.query.eventTypes]);
  const [optimisticEventTypes, setOptimisticEventTypes] = useState<
    string[] | null
  >(null);
  const optimisticEventTypesRef = useRef<string[] | null>(null);
  const navigationId = useRef(0);
  const selectedEventTypes = optimisticEventTypes ?? urlEventTypes;
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    if (selectedEventTypes.length === 0) {
      return mergedEvents;
    }
    return mergedEvents.filter((event) =>
      selectedEventTypes.includes(event?.__typename)
    );
  }, [mergedEvents, selectedEventTypes]);

  const updateFilters = async (eventTypes: string[]) => {
    if (!router.isReady) return;

    const currentNavigationId = ++navigationId.current;
    // Keep rapid clicks cumulative, even before React renders or the URL changes.
    optimisticEventTypesRef.current = eventTypes;
    setOptimisticEventTypes(eventTypes);

    const query = { ...router.query };
    if (eventTypes.length) {
      query.eventTypes = eventTypes.join(",");
    } else {
      delete query.eventTypes;
    }

    try {
      await router.push(
        {
          pathname: router.pathname,
          query,
          hash: router.asPath.split("#")[1],
        },
        undefined,
        { shallow: true, scroll: false }
      );
    } catch (error) {
      if (!(error as { cancelled?: boolean })?.cancelled) {
        console.error("Failed to update history filters:", error);
      }
    } finally {
      // An older navigation must not discard a newer optimistic selection.
      if (currentNavigationId === navigationId.current) {
        optimisticEventTypesRef.current = null;
        setOptimisticEventTypes(null);
      }
    }
  };

  const toggleEventType = (eventType: string) => {
    const current = optimisticEventTypesRef.current ?? urlEventTypes;
    void updateFilters(
      current.includes(eventType)
        ? current.filter((type) => type !== eventType)
        : [...current, eventType]
    );
  };

  const clearFilters = () => {
    void updateFilters([]);
  };

  // Close filter when scrolling outside the filter area (page scroll)
  useEffect(() => {
    if (!isFilterOpen) return;

    const popoverSelector = "[data-history-filter-popover]";
    let popoverElement = document.querySelector(popoverSelector);

    const handleScroll = (event: globalThis.Event) => {
      if (!popoverElement || !popoverElement.isConnected) {
        popoverElement = document.querySelector(popoverSelector);
      }

      if (!popoverElement) {
        // Popover not found, close it
        setIsFilterOpen(false);
        return;
      }

      const currentPopoverElement = popoverElement;

      // Use composedPath to check if the scroll event originated from within the popover
      const path = event.composedPath();
      const isScrollingInsidePopover = path.some(
        (el) =>
          el === currentPopoverElement ||
          (el instanceof Node && currentPopoverElement.contains(el))
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
