import { EnsIdentity } from "@lib/api/types/get-ens";
import { Box, Card, Flex, Text } from "@livepeer/design-system";
import { AccountQueryResult, OrchestratorsSortedQueryResult } from "apollo";
import { useEnsData, useExplorerStore } from "hooks";
import numeral from "numeral";
import { useMemo, useState } from "react";
import ArrowDown from "../../public/img/arrow-down.svg";
import Footer from "./Footer";
import Header from "./Header";
import InputBox from "./InputBox";
import ProjectionBox from "./ProjectionBox";
import { Tab, TabList, Tabs } from "./Tabs";

// Define a type for either a Transcoder or a Delegate.
export type TranscoderOrDelegateType =
  | NonNullable<AccountQueryResult["data"]>["transcoder"]
  | NonNullable<NonNullable<AccountQueryResult["data"]>["delegator"]>["delegate"];

interface Props {
  transcoders: NonNullable<
    OrchestratorsSortedQueryResult["data"]
  >["transcoders"] | undefined;
  transcoder: TranscoderOrDelegateType | undefined;
  delegator?: NonNullable<AccountQueryResult["data"]>["delegator"] | undefined;
  protocol: NonNullable<AccountQueryResult["data"]>["protocol"] | undefined;
  treasury: { treasuryRewardCutRate: number };
  account: EnsIdentity;
  delegateProfile?: EnsIdentity;
}

const Index = ({
  transcoders,
  delegator,
  account,
  transcoder,
  protocol,
  treasury,
  delegateProfile,
}: Props) => {
  const [amount, setAmount] = useState("");
  const { selectedStakingAction, setSelectedStakingAction } =
    useExplorerStore();

  const isMyTranscoder = useMemo(
    () => delegator?.delegate?.id === transcoder?.id,
    [delegator, transcoder]
  );

  const delegateEns = useEnsData(delegator?.delegate?.id);

  const isDelegated = useMemo(
    () => delegator?.bondedAmount && delegator?.bondedAmount !== "0",
    [delegator]
  );
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
          index={selectedStakingAction === "delegate" ? 0 : 1}
          onChange={(index: number) => {
            setSelectedStakingAction(index ? "undelegate" : "delegate");
          }}
        >
          <TabList>
            <Tab isSelected={selectedStakingAction === "delegate"}>
              Delegate
            </Tab>
            <Tab
              disabled={isTransferStake}
              isSelected={selectedStakingAction === "undelegate"}
            >
              Undelegate
            </Tab>
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
                      {delegateEns.name
                        ? delegateEns.name
                        : delegateEns.idShort ?? ""}
                    </Box>
                    {" to "}
                    <Box as="span" css={{ fontWeight: 700 }}>
                      {delegateProfile?.name ?? delegateProfile?.idShort ?? ""}
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
              action={selectedStakingAction}
              delegator={delegator}
              transcoder={transcoder}
              amount={amount}
              setAmount={setAmount}
              protocol={protocol}
              treasury={treasury}
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
            <ProjectionBox action={selectedStakingAction} />
          </>
        )}
        <Footer
          reset={() => setAmount("")}
          data={{
            isTransferStake: isTransferStake || false,
            isMyTranscoder,
            isDelegated: isDelegated || false,
            transcoders,
            currentRound: protocol?.currentRound,
            account,
            delegator,
            transcoder,
            action: selectedStakingAction,
            amount,
          }}
        />
      </Box>
    </Box>
  );
};

export default Index;
