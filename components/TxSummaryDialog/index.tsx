import {
  Box,
  Flex,
  Dialog,
  DialogContent,
  Text,
  Button,
} from "@livepeer/design-system";
import { keyframes } from "@livepeer/design-system";
import { sentenceCase } from "change-case";
import { useExplorerStore } from "hooks";
import { useCallback } from "react";
import CloseIcon from "../../public/img/close.svg";

const rotate = keyframes({
  "100%": { transform: "rotate(360deg)" },
});

const Index = () => {
  const { latestTransaction, clearLatestTransaction } = useExplorerStore();

  if (!latestTransaction || latestTransaction.step !== "summary") {
    return null;
  }

  return (
    <Dialog open={true}>
      <DialogContent
        css={{ minWidth: 370 }}
        onPointerDownOutside={clearLatestTransaction}
      >
        <Flex
          css={{
            justifyContent: "flex-end",
          }}
        >
          <Box
            as={CloseIcon}
            css={{
              zIndex: 1,
              right: 20,
              cursor: "pointer",
              top: 20,
              color: "$white",
            }}
            onClick={clearLatestTransaction}
          />
        </Flex>

        {latestTransaction?.error ? (
          <Box />
        ) : (
          <Flex
            css={{
              pt: "$2",
              pb: "$5",
              flexDirection: "column",
              justifyContent: "flex-start",
              width: "100%",
              alignItems: "center",
            }}
          >
            <Box
              as="img"
              src="/img/green-loader.svg"
              alt="loader"
              css={{
                animation: `${rotate} 2s linear`,
                animationIterationCount: "infinite",
                height: "90px",
                width: "90px",
              }}
            />
          </Flex>
        )}
        <Box
          css={{
            display: "grid",
            gridAutoRows: "auto",
            rowGap: "10px",
            justifyItems: "center",
          }}
        >
          <Box css={{ fontSize: "$4", fontWeight: 600 }}>
            {!latestTransaction?.error ? "Waiting for confirmation" : "Error"}
          </Box>
        </Box>
        <Box css={{ textAlign: "center", mt: "$2", fontSize: "$2" }}>
          {latestTransaction?.error ? (
            <>
              <Text css={{ mb: "$3" }}>
                {latestTransaction?.error
                  ? `${sentenceCase(latestTransaction?.error)}.`
                  : "Error with transaction, please check your inputs and try again."}
              </Text>
              <Button
                onClick={clearLatestTransaction}
                variant="primary"
                size="4"
                css={{ width: "100%" }}
              >
                Close
              </Button>
            </>
          ) : (
            <Text>Confirm this transaction in your wallet</Text>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Index;
