import { LAYOUT_MAX_WIDTH } from "@layouts/main";
import { Box, Button, Container, Flex, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { constants, ethers } from "ethers";
import {
  useAccountAddress,
  useHandleTransaction,
  useL1DelegatorData,
  useL2Migrator,
} from "hooks";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { useEffect, useState } from "react";

const Claim = () => {
  const accountAddress = useAccountAddress();

  const l1Delegator = useL1DelegatorData(accountAddress);

  const [migrationParams, setMigrationParams] = useState(undefined);
  const [isDelegator, setIsDelegator] = useState(false);
  const [isClaimStakeEnabled, setIsClaimStakeEnabled] = useState(false);
  const [isMigrated, setIsMigrated] = useState(false);
  const [loading, setLoading] = useState(true);

  const l2Migrator = useL2Migrator();
  const handleTransaction = useHandleTransaction("claimStake", () =>
    setIsMigrated(true)
  );

  useEffect(() => {
    const init = async () => {
      console.log(l2Migrator);
      console.log(l1Delegator);
      if (accountAddress && l2Migrator && l1Delegator) {
        setLoading(true);

        // reset on account change
        setIsDelegator(false);

        console.log(l1Delegator);

        const claimStakeEnabled = await l2Migrator.claimStakeEnabled();
        setIsClaimStakeEnabled(claimStakeEnabled);

        console.log({ claimStakeEnabled });

        const isMigrated = await l2Migrator.migratedDelegators(accountAddress);
        setIsMigrated(isMigrated);

        console.log({ isMigrated });

        setMigrationParams({
          delegate: l1Delegator.delegateAddress,
          stake: l1Delegator.pendingStake,
          fees: l1Delegator.pendingFees,
        });

        if (
          l1Delegator.transcoderStatus === "not-registered" &&
          (l1Delegator.pendingStake !== "0" ||
            l1Delegator.pendingFees !== "0" ||
            l1Delegator.unbondingLocks.length > 1)
        ) {
          setIsDelegator(true);
        }
        setLoading(false);
      }
    };
    init();
  }, [accountAddress, l2Migrator, l1Delegator]);

  return loading || !isDelegator || isMigrated ? null : (
    <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, mb: "$5" }}>
      <Box
        css={{
          mt: "$5",
          borderRadius: 10,
          width: "100%",
          padding: "$4",
          background:
            "linear-gradient(91.88deg, #113123 0.27%, #164430 36.6%, #1B543A 69.35%, #236E4A 98.51%)",
        }}
      >
        <Box>
          <Box
            css={{
              mb: "$2",
              fontSize: "$6",
              fontWeight: 600,
            }}
          >
            Claim stake & fees on {CHAIN_INFO[DEFAULT_CHAIN_ID].label}
          </Box>

          <Text>
            Your delegated stake of
            <Box
              css={{
                display: "inline",
                fontWeight: 700,
                borderBottom: "1px dashed $neutral11",
                fontSize: "$3",
                color: "$hiContrast",
                mx: "$1",
                letterSpacing: "-.4px",
              }}
            >
              {ethers.utils.formatEther(migrationParams?.stake)} LPT
            </Box>
            and
            <Box
              css={{
                display: "inline",
                fontWeight: 700,
                fontSize: "$3",
                color: "$hiContrast",
                borderBottom: "1px dashed $neutral11",
                mx: "$1",
                letterSpacing: "-.4px",
              }}
            >
              {ethers.utils.formatEther(migrationParams.fees)} ETH
            </Box>
            in earned fees{" "}
            {isClaimStakeEnabled
              ? `is availabile to claim on ${CHAIN_INFO[DEFAULT_CHAIN_ID].label}.`
              : `will be available to claim on ${CHAIN_INFO[DEFAULT_CHAIN_ID].label} upon deployment of the delegator
          state snapshot.`}
          </Text>
        </Box>
        <Box
          css={{
            mt: "$3",
            mb: "$5",
            maxWidth: 350,
          }}
        >
          <Text
            css={{
              fontSize: "$1",
              lineHeight: 1.9,
              color: "rgba(255,255,255, .6)",
            }}
          >
            Delegating with
          </Text>
          <Box
            className="delegateAddress"
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pb: "$1",
              borderBottom: "1px solid rgba(255,255,255, .2)",
            }}
          >
            {migrationParams.delegate.replace(
              migrationParams.delegate.slice(6, 38),
              "…"
            )}
          </Box>
        </Box>
        <Flex css={{ mt: "$3", alignItems: "center" }}>
          {isClaimStakeEnabled && (
            <Button
              onClick={async () => {
                const mutation = async () => {
                  try {
                    const res = await fetch("/api/generateProof", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        account: accountAddress,
                        delegate: migrationParams.delegate,
                        stake: migrationParams.stake,
                        fees: migrationParams.fees,
                      }),
                    });
                    const proof = await res.json();

                    return l2Migrator.claimStake(
                      migrationParams.delegate,
                      migrationParams.stake,
                      migrationParams.fees,
                      proof,
                      constants.AddressZero
                    );
                  } catch (e) {
                    console.log(e);
                    throw new Error(e);
                  }
                };

                setTimeout(() => {
                  handleTransaction(mutation, {});
                }, 1000);
              }}
              size="3"
              variant="transparentWhite"
              css={{ mr: "$2" }}
            >
              Claim Stake & Fees
            </Button>
          )}
          <Button
            as="a"
            href="https://discord.gg/XYJ7aVNqkS"
            target="_blank"
            size="3"
            variant="transparentWhite"
            ghost
          >
            Discord Support Channel{" "}
            <Box css={{ ml: "$1" }} as={ArrowTopRightIcon} />
          </Button>
        </Flex>
      </Box>
    </Container>
  );
};

export default Claim;
