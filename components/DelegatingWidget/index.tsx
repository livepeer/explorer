import { useState } from "react";
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
  ThreeBoxSpace,
} from "../../@types";
import InputBox from "./InputBox";
import { Box, Flex } from "@livepeer/design-system";

interface Props {
  transcoders: [Transcoder];
  transcoder: Transcoder;
  delegator?: Delegator;
  protocol: Protocol;
  account: Account;
  currentRound: Round;
  selectedAction?: string;
  delegateProfile?: ThreeBoxSpace;
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
            <Tab>Undelegate</Tab>
          </TabList>
        </Tabs>

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
          <ArrowDown css={{ width: 16, color: "rgba(255, 255, 255, .8)" }} />
        </Flex>
        <ProjectionBox action={action} />
        <Footer
          reset={() => setAmount("")}
          data={{
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
