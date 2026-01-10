import PopoverLink from "@components/PopoverLink";
import {
  Box,
  Flex,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@livepeer/design-system";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

type OrchestratorActionsMenuProps = {
  accountId: string;
  isMobile?: boolean;
};

export function OrchestratorActionsMenu({
  accountId,
  isMobile = false,
}: OrchestratorActionsMenuProps) {
  return (
    <Popover>
      <PopoverTrigger
        onClick={(e) => {
          e.stopPropagation();
        }}
        asChild
      >
        <IconButton
          aria-label="Orchestrator actions"
          css={{
            cursor: "pointer",
            opacity: 1,
            transition: "background-color .3s",
            "&:hover": {
              bc: "$primary5",
              transition: "background-color .3s",
            },
          }}
        >
          <DotsHorizontalIcon />
        </IconButton>
      </PopoverTrigger>
      <PopoverContent
        css={{
          borderRadius: "$4",
          bc: "$neutral4",
          ...(isMobile && {
            marginLeft: "$3",
            marginRight: "$3",
          }),
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
        placeholder={undefined}
      >
        <Box
          css={{
            borderBottom: "1px solid $neutral6",
            paddingLeft: "$1",
            paddingRight: "$1",
            paddingTop: "$1",
            paddingBottom: "$2",
          }}
        >
          <Text
            variant="neutral"
            size="1"
            css={{
              marginLeft: "$3",
              marginTop: "$2",
              marginBottom: "$2",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Actions
          </Text>

          <PopoverLink href={`/accounts/${accountId}/orchestrating`}>
            Delegate
          </PopoverLink>
        </Box>
        <Flex
          css={{
            flexDirection: "column",
            padding: "$1",
          }}
        >
          <Text
            variant="neutral"
            size="1"
            css={{
              marginLeft: "$3",
              marginTop: "$2",
              marginBottom: "$2",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Account Details
          </Text>

          <PopoverLink href={`/accounts/${accountId}/orchestrating`}>
            Orchestrating
          </PopoverLink>
          <PopoverLink href={`/accounts/${accountId}/delegating`}>
            Delegating
          </PopoverLink>
          <PopoverLink href={`/accounts/${accountId}/history`}>
            History
          </PopoverLink>
        </Flex>
      </PopoverContent>
    </Popover>
  );
}
