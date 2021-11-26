import React from "react";
import Input from "./Input";
import Utils from "web3-utils";
import ReactTooltip from "react-tooltip";
import { Box, Flex, Card } from "@livepeer/design-system";

const InputBox = ({
  account,
  action,
  delegator,
  transcoder,
  amount,
  setAmount,
  protocol,
}) => {
  const tokenBalance =
    account && Utils.fromWei(account.tokenBalance.toString());
  const stake = delegator?.pendingStake
    ? Utils.fromWei(delegator.pendingStake)
    : "0";

  return (
    <Card
      css={{
        bc: "$neutral3",
        boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
        width: "100%",
        borderRadius: "$4",
      }}
    >
      <Box css={{ px: "$3", py: "$3" }}>
        <Box>
          <Flex
            css={{ fontSize: "$1", mb: "$3", justifyContent: "space-between" }}
          >
            <Box css={{ color: "$muted" }}>Input</Box>

            {account &&
              (action === "stake" ? (
                <Box
                  data-tip="Enter max"
                  data-for="balance"
                  onClick={() => setAmount(tokenBalance)}
                  css={{ cursor: "pointer", color: "$muted" }}
                >
                  <ReactTooltip
                    id="balance"
                    className="tooltip"
                    place="top"
                    type="dark"
                    effect="solid"
                  />
                  Balance:{" "}
                  <Box as="span" css={{ fontFamily: "$monospace" }}>
                    {parseFloat(tokenBalance)}
                  </Box>
                </Box>
              ) : (
                <>
                  {+stake > 0 && (
                    <Box
                      data-tip="Enter max"
                      data-for="stake"
                      onClick={() => setAmount(stake)}
                      css={{ cursor: "pointer", color: "$muted" }}
                    >
                      <ReactTooltip
                        id="stake"
                        className="tooltip"
                        place="top"
                        type="dark"
                        effect="solid"
                      />
                      Stake:{" "}
                      <Box as="span" css={{ fontFamily: "$monospace" }}>
                        {+stake}
                      </Box>
                    </Box>
                  )}
                </>
              ))}
          </Flex>
          <Flex
            as="form"
            css={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Input
              transcoder={transcoder}
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAmount(e.target.value ? e.target.value : "");
              }}
              protocol={protocol}
            />
          </Flex>
        </Box>
      </Box>
    </Card>
  );
};

export default InputBox;
