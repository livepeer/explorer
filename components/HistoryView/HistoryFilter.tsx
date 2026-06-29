import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@livepeer/design-system";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";

export type EventFilterKey =
  | "delegated"
  | "redelegated"
  | "undelegated"
  | "reward"
  | "transcoderUpdate"
  | "withdrawStake"
  | "withdrawFees"
  | "winningTicket"
  | "deposit"
  | "reserve"
  | "votes"
  | "round";

// Each filter maps a human-readable label to one or more event __typenames.
export const EVENT_FILTERS: {
  key: EventFilterKey;
  label: string;
  typenames: string[];
}[] = [
  { key: "delegated", label: "Delegated", typenames: ["BondEvent"] },
  { key: "redelegated", label: "Redelegated", typenames: ["RebondEvent"] },
  { key: "undelegated", label: "Undelegated", typenames: ["UnbondEvent"] },
  { key: "reward", label: "Reward calls", typenames: ["RewardEvent"] },
  {
    key: "transcoderUpdate",
    label: "Reward cut & fee changes",
    typenames: ["TranscoderUpdateEvent"],
  },
  {
    key: "withdrawStake",
    label: "Stake withdrawals",
    typenames: ["WithdrawStakeEvent"],
  },
  {
    key: "withdrawFees",
    label: "Fee withdrawals",
    typenames: ["WithdrawFeesEvent"],
  },
  {
    key: "winningTicket",
    label: "Winning tickets",
    typenames: ["WinningTicketRedeemedEvent"],
  },
  {
    key: "deposit",
    label: "Deposit funded",
    typenames: ["DepositFundedEvent"],
  },
  {
    key: "reserve",
    label: "Reserve funded",
    typenames: ["ReserveFundedEvent"],
  },
  {
    key: "votes",
    label: "Votes",
    typenames: ["VoteEvent", "TreasuryVoteEvent"],
  },
  { key: "round", label: "Round initialized", typenames: ["NewRoundEvent"] },
];

export const ALL_FILTER_KEYS: EventFilterKey[] = EVENT_FILTERS.map(
  (f) => f.key
);

// Reverse lookup from an event's __typename to the filter key it belongs to.
export const TYPENAME_TO_FILTER: Record<string, EventFilterKey> =
  EVENT_FILTERS.reduce((acc, filter) => {
    filter.typenames.forEach((typename) => {
      acc[typename] = filter.key;
    });
    return acc;
  }, {} as Record<string, EventFilterKey>);

interface HistoryFilterProps {
  selected: Set<EventFilterKey>;
  onToggle: (key: EventFilterKey) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

const HistoryFilter = ({
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: HistoryFilterProps) => {
  const activeCount = selected.size;
  // A filter is "active" whenever the selection differs from showing everything.
  const isFiltered = activeCount !== EVENT_FILTERS.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="2"
          variant={isFiltered ? "primary" : "neutral"}
          css={{
            display: "inline-flex",
            alignItems: "center",
            gap: "$1",
            cursor: "pointer",
          }}
        >
          <Box as={MixerHorizontalIcon} css={{ width: 14, height: 14 }} />
          <Box as="span">Filter</Box>
          {isFiltered && (
            <Badge
              size="1"
              css={{
                backgroundColor: "$neutral1",
                color: "$hiContrast",
                fontWeight: 600,
                minWidth: 18,
                justifyContent: "center",
              }}
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        css={{
          minWidth: 240,
          borderRadius: "$4",
          bc: "$neutral4",
          boxShadow:
            "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
        }}
      >
        <Flex
          css={{
            alignItems: "center",
            justifyContent: "space-between",
            padding: "$3",
            borderBottom: "1px solid $neutral6",
          }}
        >
          <Text size="1" css={{ fontWeight: 600, textTransform: "uppercase" }}>
            Event types
          </Text>
          <Flex css={{ gap: "$3" }}>
            <Box
              as="button"
              type="button"
              onClick={onSelectAll}
              css={{
                all: "unset",
                cursor: "pointer",
                fontSize: "$1",
                color: "$primary11",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              All
            </Box>
            <Box
              as="button"
              type="button"
              onClick={onClear}
              css={{
                all: "unset",
                cursor: "pointer",
                fontSize: "$1",
                color: "$primary11",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              None
            </Box>
          </Flex>
        </Flex>
        <Box css={{ padding: "$2", maxHeight: 320, overflowY: "auto" }}>
          {EVENT_FILTERS.map((filter) => {
            const checked = selected.has(filter.key);
            return (
              <Flex
                key={filter.key}
                onClick={() => onToggle(filter.key)}
                css={{
                  alignItems: "center",
                  gap: "$2",
                  padding: "$2",
                  borderRadius: "$2",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { bc: "$neutral5" },
                }}
              >
                <Checkbox
                  checked={checked}
                  // The row's onClick is the single source of truth for toggling.
                  css={{ pointerEvents: "none" }}
                  tabIndex={-1}
                />
                <Text size="2">{filter.label}</Text>
              </Flex>
            );
          })}
        </Box>
      </PopoverContent>
    </Popover>
  );
};

export default HistoryFilter;
