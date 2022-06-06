import { useMemo, useState } from "react";
import Header from "./Header";
import ProjectionBox from "./ProjectionBox";
import ArrowDown from "../../public/img/arrow-down.svg";
import Footer from "./Footer";
import { Tabs, TabList, Tab } from "./Tabs";
import {
  Account,
  Delegator,
  Transcoder,
  Protocol,
  Round,
  Identity,
} from "../../@types";
import InputBox from "./InputBox";
import { Box, Text, Card, Flex, Button } from "@livepeer/design-system";
import numeral from "numeral";
import { useEnsName } from "hooks";

interface Props {
  transcoders: [Transcoder];
  transcoder: Transcoder;
  delegator?: Delegator;
  protocol: Protocol;
  account: Account;
  currentRound: Round;
  selectedAction?: string;
  delegateProfile?: Identity;
}

const Index = ({
  transcoders,
  delegator,
  account,
  transcoder,
  protocol,
  currentRound,
  selectedAction = "delegate",
  delegateProfile,
}: Props) => {
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState(selectedAction);

  const isMyTranscoder = useMemo(
    () => delegator?.delegate?.id === transcoder?.id,
    [delegator, transcoder]
  );

  const delegateEns = useEnsName(delegator?.delegate?.id);

  const isDelegated =
    delegator?.bondedAmount && delegator?.bondedAmount !== "0";
  const isTransferStake = useMemo(
    () => !isMyTranscoder && isDelegated,
    [isMyTranscoder, isDelegated]
  );

  return (
    <Box
      css={{
        width: "100%",
        borderTopRightRadius: 16,
        borderTopLeftRadius: 16,
        backgroundColor: "$panel",
        border: "1px solid $neutral4",
        "@bp3": {
          borderBottomRightRadius: 16,
          borderBottomLeftRadius: 16,
        },
      }}
    >
      <Header transcoder={transcoder} delegateProfile={delegateProfile} />
      <Box css={{ pt: "$2", pb: "$3", px: "$3" }}>
        <Tabs
          defaultIndex={selectedAction === "delegate" ? 0 : 1}
          onChange={(index: number) =>
            setAction(index ? "undelegate" : "delegate")
          }
        >
          <TabList>
            <Tab>Delegate</Tab>
            <Tab disabled={isTransferStake}>Undelegate</Tab>
          </TabList>
        </Tabs>

        {isTransferStake ? (
          <>
            <Card
              css={{
                bc: "$neutral3",
                boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
                width: "100%",
                borderRadius: "$4",
                mb: "$3",
              }}
            >
              <Box css={{ px: "$3", py: "$3" }}>
                <Flex
                  css={{
                    fontSize: "$1",
                    justifyContent: "center",
                  }}
                >
                  <Text variant="neutral" css={{ textAlign: "center" }}>
                    {`This transaction will move your current delegated stake of `}
                    <Box as="span" css={{ fontWeight: 700 }}>
                      {numeral(delegator?.bondedAmount || 0).format("0,0.0")}
                      {` LPT`}
                    </Box>
                    {` from `}
                    <Box as="span" css={{ fontWeight: 700 }}>
                      {delegateEns
                        ? delegateEns
                        : delegator?.delegate?.id?.replace(
                            delegator?.delegate?.id?.slice(7, 37),
                            "…"
                          ) ?? ""}
                    </Box>
                    {" to "}
                    <Box as="span" css={{ fontWeight: 700 }}>
                      {delegateProfile?.name ??
                        transcoder.id.replace(transcoder.id.slice(7, 37), "…")}
                    </Box>
                    {"."}
                  </Text>
                </Flex>
              </Box>
            </Card>
          </>
        ) : (
          <>
            <InputBox
              account={account}
              action={action}
              delegator={delegator}
              transcoder={transcoder}
              amount={amount}
              setAmount={setAmount}
              protocol={protocol}
            />
            <Flex
              css={{
                alignItems: "center",
                justifyContent: "center",
                width: "95%",
                height: 32,
                margin: "0 auto",
              }}
            >
              <ArrowDown
                css={{ width: 16, color: "rgba(255, 255, 255, .8)" }}
              />
            </Flex>
            <ProjectionBox action={action} />
          </>
        )}
        <Footer
          reset={() => setAmount("")}
          data={{
            isTransferStake,
            isMyTranscoder,
            isDelegated,
            transcoders,
            currentRound,
            account,
            delegator,
            transcoder,
            action,
            amount,
          }}
        />
      </Box>
    </Box>
  );
};

export default Index;
