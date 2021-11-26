import { useRouter } from "next/router";
import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import { useQuery } from "@apollo/client";
import OrchestratingView from "@components/OrchestratingView";
import Spinner from "@components/Spinner";
import { usePageVisibility } from "../../../hooks";
import { useEffect } from "react";
import { accountQuery } from "../../../queries/accountQuery";
import { gql } from "@apollo/client";
import { Flex } from "@livepeer/design-system";

const pollInterval = 5000;

const Orchestrating = () => {
  const isVisible = usePageVisibility();
  const router = useRouter();
  const { query } = router;

  const { data: currentRoundData } = useQuery(gql`
    {
      protocol(id: "0") {
        currentRound {
          id
        }
      }
    }
  `);

  const q = accountQuery(currentRoundData?.protocol.currentRound.id);

  const account = query?.account?.toString().toLowerCase();

  const {
    data,
    loading,
    startPolling: startPollingAccount,
    stopPolling: stopPollingAccount,
  } = useQuery(q, {
    variables: {
      account,
    },
    pollInterval,
  });

  useEffect(() => {
    if (!isVisible) {
      stopPollingAccount();
    } else {
      startPollingAccount(pollInterval);
    }
  }, [isVisible, stopPollingAccount, startPollingAccount]);

  if (loading) {
    return (
      <Flex
        css={{
          height: "calc(100vh - 100px)",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          "@bp3": {
            height: "100vh",
          },
        }}
      >
        <Spinner />
      </Flex>
    );
  }

  return (
    <AccountLayout>
      <OrchestratingView
        currentRound={data.protocol.currentRound}
        transcoder={data.transcoder}
      />
    </AccountLayout>
  );
};

Orchestrating.getLayout = getLayout;

export default Orchestrating;
