import { useState } from "react";
import { Collapse } from "react-collapse";
import { useMutation, gql } from "@apollo/client";
import { useWeb3React } from "@web3-react/core";
import { Button, Box, Flex } from "@livepeer/design-system";

const REMOVE_ADDRESS_LINK = gql`
  mutation removeAddressLink($address: String) {
    removeAddressLink(address: $address)
  }
`;

const Index = ({ threeBoxSpace, refetch, children }) => {
  const [open, setOpen] = useState(false);
  const context = useWeb3React();
  const [removeAddressLink] = useMutation(REMOVE_ADDRESS_LINK);
  const [disconnecting, setDisconnecting] = useState({
    address: "",
    isDisconnecting: false,
  });

  return (
    <Box
      css={{
        backgroundColor: "$neutral3",
        border: "1px dashed $neutral4",
        borderRadius: "$4",
        p: "$3",
      }}
    >
      <Flex
        css={{
          alignItems: "center",
          fontWeight: 500,
          fontSize: "$3",
          mb: "$3",
        }}
      >
        <Box>External Accounts</Box>
        <Box
          css={{
            borderRadius: 1000,
            width: 2,
            height: 2,
            backgroundColor: "$neutral4",
            mx: "$2",
          }}
        />
        <Button
          variant="ghost"
          onClick={() => {
            setOpen(open ? false : true);
          }}
        >
          {open ? "Cancel" : "Add Account"}
        </Button>
      </Flex>
      <Box css={{ lineHeight: "24px" }}>
        If you operate an orchestrator, adding an external account allows you to
        enjoy the benefits of a profile web UI, while keeping your keys in a
        more secure environment.
      </Box>
      <Collapse isOpened={open}>{children}</Collapse>
      <Collapse isOpened={threeBoxSpace.addressLinks.length && !open}>
        <Box css={{ pt: "$3", color: "$text" }}>
          {threeBoxSpace.addressLinks.map((link, i) => (
            <Flex
              key={i}
              css={{
                alignItems: "center",
                p: "$3",
                borderRadius: 6,
                mb: "$3",
                bg: "rgba(255, 255, 255, .05)",
                justifyContent: "space-between",
                "&:last-child": {
                  mb: 0,
                },
              }}
            >
              <Box
                css={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "$monospace",
                  fontSize: "$2",
                }}
              >
                {link.address}
              </Box>
              <Button
                as="div"
                size="small"
                color="danger"
                onClick={async () => {
                  const r = confirm(
                    "Are you sure you want to disconnect this account?"
                  );
                  if (r) {
                    const Box = require("3box");
                    setDisconnecting({
                      address: link.address,
                      isDisconnecting: true,
                    });
                    const box = await Box.openBox(
                      context.account,
                      context.library._web3Provider
                    );
                    await removeAddressLink({
                      variables: {
                        address: link.address,
                      },
                      context: {
                        box,
                      },
                    });
                    await refetch({
                      variables: context.account,
                    });
                    setDisconnecting({
                      address: link.address,
                      isDisconnecting: false,
                    });
                  }
                }}
              >
                {disconnecting.address === link.address &&
                disconnecting.isDisconnecting
                  ? "Disconnecting..."
                  : "Disconnect"}
              </Button>
            </Flex>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default Index;
