import FilterIcon from "@components/Icons/FilterIcon";
import {
  Badge,
  Box,
  Button,
  Flex,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@livepeer/design-system";
import { CheckIcon } from "@modulz/radix-icons";

interface HistoryFilterProps {
  selectedEventTypes: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleEventType: (eventType: string) => void;
  onClearFilters: () => void;
  allEventTypes: string[];
  eventTypeLabels: Record<string, string>;
}

const HistoryFilter = ({
  selectedEventTypes,
  isOpen,
  onOpenChange,
  onToggleEventType,
  onClearFilters,
  allEventTypes,
  eventTypeLabels,
}: HistoryFilterProps) => {
  const hasActiveFilters = selectedEventTypes.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          role="button"
          size="2"
          variant="neutral"
          css={{
            minWidth: "unset",
            minHeight: "44px",
            display: "inline-flex",
            alignItems: "center",
            gap: "$2",
          }}
        >
          <Flex css={{ alignItems: "center", gap: "$2" }}>
            <FilterIcon
              size={16}
              css={{
                color: hasActiveFilters ? "$primary11" : "$neutral11",
              }}
            />
            <Text
              size="2"
              css={{
                color: "$hiContrast",
                fontWeight: 600,
              }}
            >
              Filter
            </Text>
          </Flex>
          <Badge
            size="1"
            variant={hasActiveFilters ? "primary" : "neutral"}
            css={{
              width: 22,
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {selectedEventTypes.length}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-history-filter-popover
        css={{
          width: 280,
          borderRadius: "$4",
          bc: "$neutral4",
          padding: 0,
          boxShadow:
            "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
          zIndex: 9,
          display: "flex",
          flexDirection: "column",
          maxHeight: 400,
          marginRight: "$3",
          overflow: "hidden",
        }}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        placeholder={undefined}
      >
        <Flex
          css={{
            paddingLeft: "$3",
            paddingRight: "$3",
            paddingTop: "$2",
            paddingBottom: "$2",
            borderBottom: "1px solid $neutral6",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            backgroundColor: "$neutral4",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <Button
            type="button"
            size="1"
            variant="neutral"
            ghost
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
            css={{ minWidth: "unset" }}
          >
            Clear
          </Button>
          <Text
            variant="neutral"
            size="1"
            css={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Filters
          </Text>
          <Button
            type="button"
            size="1"
            variant="neutral"
            ghost
            onClick={() => onOpenChange(false)}
            css={{ minWidth: "unset" }}
          >
            Done
          </Button>
        </Flex>

        <Flex
          data-history-filter-scrollable
          css={{
            flexDirection: "column",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <Box css={{ padding: "$3" }}>
            <Text
              variant="neutral"
              size="1"
              css={{
                display: "block",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: "$2",
              }}
            >
              Event Type
            </Text>
            <Flex css={{ flexDirection: "column", gap: "$1" }}>
              {allEventTypes.map((eventType) => {
                const isChecked = selectedEventTypes.includes(eventType);

                return (
                  <Flex
                    as="button"
                    type="button"
                    key={eventType}
                    aria-pressed={isChecked}
                    css={{
                      width: "100%",
                      alignItems: "center",
                      cursor: "pointer",
                      border: 0,
                      backgroundColor: isChecked ? "$neutral3" : "transparent",
                      boxShadow: isChecked
                        ? "$colors$neutral5 0px 0px 0px 1px inset"
                        : "none",
                      padding: "$2",
                      borderRadius: "$2",
                      textAlign: "left",
                      transition: "background-color 0.2s ease",
                      "&:hover": {
                        backgroundColor: isChecked ? "$neutral4" : "$neutral6",
                      },
                      "&:focus-visible": {
                        outline: "none",
                        boxShadow: "inset 0 0 0 1px $colors$primary8",
                      },
                    }}
                    onClick={() => onToggleEventType(eventType)}
                  >
                    <Box
                      css={{
                        width: 18,
                        height: 18,
                        border: "1px solid",
                        borderColor: isChecked ? "$primary8" : "$neutral7",
                        backgroundColor: isChecked
                          ? "$primary9"
                          : "transparent",
                        borderRadius: "$1",
                        marginRight: "$2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isChecked && (
                        <Box
                          as={CheckIcon}
                          css={{
                            width: 12,
                            height: 12,
                            color: "white",
                          }}
                        />
                      )}
                    </Box>
                    <Text
                      size="2"
                      css={{
                        color: "$hiContrast",
                        fontWeight: isChecked ? 600 : 400,
                        userSelect: "none",
                      }}
                    >
                      {eventTypeLabels[eventType]}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Flex>
      </PopoverContent>
    </Popover>
  );
};

export default HistoryFilter;
