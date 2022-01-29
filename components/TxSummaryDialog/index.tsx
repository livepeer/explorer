import { useQuery, gql } from "@apollo/client";
import {
  Box,
  Flex,
  Dialog,
  DialogContent,
  Text,
  Button,
} from "@livepeer/design-system";
import { keyframes } from "@livepeer/design-system";
import CloseIcon from "../../public/img/close.svg";

const rotate = keyframes({
  "100%": { transform: "rotate(360deg)" },
});

const Index = ({ isOpen, onDismiss }) => {
  const GET_TX_SUMMARY_MODAL = gql`
    {
      txSummaryModal @client {
        __typename
        open
        error
      }
    }
  `;

  const { data } = useQuery(GET_TX_SUMMARY_MODAL);

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent css={{ minWidth: 370 }} onPointerDownOutside={onDismiss}>
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
            onClick={onDismiss}
          />
        </Flex>

        {data?.txSummaryModal?.error ? (
          <Box />
        ) : (
          <Flex
            css={{
              py: "$5",
              flexDirection: "column",
              justifyContent: "flex-start",
              width: "100%",
              alignItems: "center",
              padding: "60px 0px",
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
          {!data?.txSummaryModal?.error && (
            <Box css={{ fontSize: "$4", fontWeight: 600 }}>
              Waiting For Confirmation
            </Box>
          )}
        </Box>
        <Box css={{ textAlign: "center", mt: "$2", fontSize: "$2" }}>
          {data?.txSummaryModal?.error ? (
            <>
              <Text css={{ mb: "$3" }}>Transaction Error</Text>
              <Button
                onClick={onDismiss}
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
