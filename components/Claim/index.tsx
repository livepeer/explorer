import {
  Box,
  Text,
  Flex,
  Button,
  Link as A,
  Container,
  DialogContent,
  Dialog,
  Heading,
} from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { useWeb3React } from "@web3-react/core";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  INFURA_NETWORK_URLS,
  L1_CHAIN_ID,
  l2Migrator,
} from "constants/chains";
import { ethers, constants, utils } from "ethers";
import { useContext, useEffect, useState } from "react";
import LivepeerSDK from "@livepeer/sdk";
import { EarningsTree } from "@lib/earningsTree";
import delegatorClaimSnapshot from "../../data/delegatorClaimSnapshot.json";
import { useApolloClient } from "@apollo/client";
import { initTransaction } from "@lib/utils";
import { MutationsContext } from "contexts";
import ThreeBox from "3box";

const getDelegatorOnL1 = async (account) => {
  const sdk = await LivepeerSDK({
    controllerAddress: CHAIN_INFO[L1_CHAIN_ID].contracts.controller,
    provider: INFURA_NETWORK_URLS[L1_CHAIN_ID],
    account: account,
  });
  const delegator = await sdk.rpc.getDelegator(account);
  const status = await sdk.rpc.getTranscoderStatus(account);
  const unbondingLocks = await sdk.rpc.getDelegatorUnbondingLocks(account);
  return { delegator, status, unbondingLocks };
};

const Claim = () => {
  const context = useWeb3React();
  const client = useApolloClient();
  const { claimStake }: any = useContext(MutationsContext);
  const [migrationParams, setMigrationParams] = useState(undefined);
  const [isDelegator, setIsDelegator] = useState(false);
  const [isClaimStakeEnabled, setIsClaimStakeEnabled] = useState(false);
  const [isMigrated, setIsMigrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generatingProof, setGeneratingProof] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (context.account) {
        setLoading(true);

        // reset on account change
        setIsDelegator(false);

        const { delegator, status, unbondingLocks } = await getDelegatorOnL1(
          context.account
        );

        const claimStakeEnabled = await l2Migrator.claimStakeEnabled();
        setIsClaimStakeEnabled(claimStakeEnabled);

        const isMigrated = await l2Migrator.migratedDelegators(context.account);
        setIsMigrated(isMigrated);

        const space = await ThreeBox.getSpace(
          delegator.delegateAddress,
          "livepeer"
        );
        setMigrationParams({
          delegateName: space?.name,
          delegate: delegator.delegateAddress,
          stake: delegator.pendingStake,
          fees: delegator.pendingFees,
        });

        if (
          status === "NotRegistered" &&
          (delegator.pendingStake !== "0" ||
            delegator.pendingFees !== "0" ||
            unbondingLocks.length > 1)
        ) {
          setIsDelegator(true);
        }
        setLoading(false);
      }
    };
    init();
  }, [context.account]);

  return loading || !isDelegator || isMigrated ? null : (
    <Container size="3" css={{ mb: "$5" }}>
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
            )}{" "}
            {migrationParams?.delegateName &&
              `(${migrationParams.delegateName})`}
          </Box>
        </Box>
        <Dialog open={generatingProof}>
          <DialogContent css={{ overflow: "scroll", p: 0, width: 370 }}>
            <Heading
              size="1"
              css={{
                px: "$4",
                py: "$2",
                fontSize: "$4",
                fontWeight: 600,
                borderBottom: "1px solid $neutral4",
              }}
            >
              Generating proof
            </Heading>
            <Box css={{ px: "$4", pt: "$3" }}>
              <Text variant="neutral" css={{ mb: "$3" }}>
                This will take ~10 seconds, after which you will be prompted to
                submit a transaction to claim your staked LPT and earned fees
              </Text>
            </Box>
          </DialogContent>
        </Dialog>
        <Flex css={{ mt: "$3", alignItems: "center" }}>
          {isClaimStakeEnabled && (
            <Button
              onClick={async () => {
                setGeneratingProof(true);
                const mutation = async () => {
                  try {
                    // generate the merkle tree from JSON
                    const tree = EarningsTree.fromJSON(
                      JSON.stringify(delegatorClaimSnapshot)
                    );

                    // generate the proof
                    const leaf = utils.solidityPack(
                      ["address", "address", "uint256", "uint256"],
                      [
                        context.account,
                        migrationParams.delegate,
                        migrationParams.stake,
                        migrationParams.fees,
                      ]
                    );

                    const proof = tree.getHexProof(leaf);

                    setGeneratingProof(false);

                    await claimStake({
                      variables: {
                        delegate: migrationParams.delegate,
                        stake: migrationParams.stake,
                        fees: migrationParams.fees,
                        proof,
                        newDelegate: constants.AddressZero,
                      },
                      context: {
                        signer: context.library.getSigner(),
                      },
                    });
                  } catch (e) {
                    console.log(e);
                    throw new Error(e);
                  }
                };

                setTimeout(() => {
                  initTransaction(client, mutation, () => setIsMigrated(true));
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
