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
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          role="button"
          css={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "$neutral4",
            color: "$hiContrast",
            minHeight: "44px",
            width: "120px",
            padding: "$2 $3",
            "&:hover": {
              backgroundColor: "$neutral5",
            },
          }}
        >
          <FilterIcon size={16} css={{ marginRight: "$1" }} />
          <Text css={{ marginRight: "$2" }}>Filter</Text>
          {selectedEventTypes.length > 0 && (
            <Badge
              css={{
                backgroundColor: "$primary9",
                color: "white",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "$1",
                fontWeight: 600,
                padding: 0,
              }}
            >
              {selectedEventTypes.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-history-filter-popover
        css={{
          width: "280px",
          backgroundColor: "$neutral4",
          borderRadius: "$3",
          padding: 0,
          boxShadow:
            "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
          border: "1px solid $neutral6",
          zIndex: 9,
          "@bp2": {
            marginRight: "$3",
          },
        }}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        placeholder={undefined}
      >
        <Flex
          css={{
            flexDirection: "column",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <Flex
            css={{
              padding: "$3",
              borderBottom: "1px solid $neutral6",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button
              onClick={onClearFilters}
              css={{
                color: "$neutral11",
                fontSize: "$2",
                padding: "$1",
                backgroundColor: "transparent",
                "&:hover": {
                  color: "$hiContrast",
                  backgroundColor: "transparent",
                },
              }}
            >
              Clear
            </Button>
            <Text css={{ fontWeight: 600, fontSize: "$3" }}>Filters</Text>
            <Button
              onClick={() => onOpenChange(false)}
              css={{
                color: "$primary11",
                fontSize: "$2",
                padding: "$1",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }}
            >
              Done
            </Button>
          </Flex>

          {/* Event type section */}
          <Box css={{ padding: "$3" }}>
            <Text
              css={{
                fontWeight: 500,
                fontSize: "$2",
                marginBottom: "$2",
                color: "$hiContrast",
              }}
            >
              Event Type
            </Text>
            <Flex css={{ flexDirection: "column", gap: "$2" }}>
              {allEventTypes.map((eventType) => {
                const isChecked = selectedEventTypes.includes(eventType);
                return (
                  <Flex
                    key={eventType}
                    css={{
                      alignItems: "center",
                      cursor: "pointer",
                      padding: "$1",
                      borderRadius: "$1",
                      "&:hover": {
                        backgroundColor: "$neutral5",
                      },
                    }}
                    onClick={() => onToggleEventType(eventType)}
                  >
                    <Box
                      css={{
                        width: "18px",
                        height: "18px",
                        border: "2px solid",
                        borderColor: isChecked ? "$primary11" : "$neutral8",
                        backgroundColor: isChecked
                          ? "$primary11"
                          : "transparent",
                        borderRadius: "$1",
                        marginRight: "$2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      {isChecked && (
                        <Box
                          as="svg"
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6L4.5 8.5L10 3"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Box>
                      )}
                    </Box>
                    <Text
                      css={{
                        fontSize: "$2",
                        color: "$hiContrast",
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
