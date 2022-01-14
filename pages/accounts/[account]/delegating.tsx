import { useRouter } from "next/router";
import { getLayout } from "@layouts/main";
import AccountLayout from "@layouts/account";
import { useQuery } from "@apollo/client";
import DelegatingView from "@components/DelegatingView";
import Spinner from "@components/Spinner";
import { usePageVisibility } from "../../../hooks";
import { useEffect } from "react";
import { accountQuery } from "../../../queries/accountQuery";
import { gql } from "@apollo/client";
import { Flex } from "@livepeer/design-system";

const pollInterval = 5000;

const Delegating = () => {
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

  const { data: dataTranscoders, loading: loadingTranscoders } = useQuery(
    gql`
      {
        transcoders(
          orderDirection: desc
          orderBy: totalStake
          where: { active: true }
        ) {
          id
          totalStake
        }
      }
    `
  );

  useEffect(() => {
    if (!isVisible) {
      stopPollingAccount();
    } else {
      startPollingAccount(pollInterval);
    }
  }, [isVisible, stopPollingAccount, startPollingAccount]);

  const { data: delegateProfile } = useQuery(
    gql`
      {
        threeBoxSpace(id: "${data?.delegator?.delegate?.id}") {
          __typename
          name
        }
      }
    `
  );

  if (loading || loadingTranscoders) {
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
      <DelegatingView
        transcoders={dataTranscoders.transcoders}
        delegator={data.delegator}
        protocol={data.protocol}
        delegateProfile={delegateProfile?.threeBoxSpace}
        currentRound={data.protocol.currentRound}
      />
    </AccountLayout>
  );
};

Delegating.getLayout = getLayout;

export default Delegating;
