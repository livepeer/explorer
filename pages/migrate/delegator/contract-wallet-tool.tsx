import Spinner from "@components/Spinner";
import { getLayout } from "@layouts/main";
import {
  Box,
  Card,
  Container,
  Flex,
  Heading,
  Link as LivepeerLink,
  styled,
  Text,
  TextField,
} from "@jjasonn.stone/design-system";
import  useForm  from "react-hook-form";
import { useL1DelegatorData } from "hooks";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  L1_CHAIN_ID,
  l2Provider,
} from "lib/chains";
import { useState } from "react";

const ReadOnlyCard = styled(Box, {
  length: {},
  display: "flex",
  backgroundColor: "$neutral3",
  border: "1px solid $neutral6",
  borderRadius: "$3",
  justifyContent: "space-between",
  alignItems: "center",
  p: "$3",
});

const ContractWalletTool = () => {
  const { register, watch } = useForm();
  const l1Addr = watch("l1Addr");
  const l2Addr = watch("l2Addr");

  const [params, setParams] = useState<any>(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const l1Delegator = useL1DelegatorData(l1Addr);

  // useEffect(() => {
  //   async function init() {
  //     if (isValidAddress(l1Addr) && isValidAddress(l2Addr)) {
  //       setLoading(true);
  //       setParams(null);
  //       const params = await getParams(
  //         l1Addr,
  //         l2Addr,
  //         inbox,
  //         l1Migrator,
  //         nodeInterface,
  //         l1Delegator
  //       );
  //       if (
  //         params?.migrateDelegatorParams ||
  //         params?.migrateUnbondingLockParams
  //       ) {
  //         setParams(params);
  //         setMessage(null);
  //       } else {
  //         setMessage("This account has no stake to migrate.");
  //       }
  //       setLoading(false);
  //     } else {
  //       setParams(null);
  //       setMessage(null);
  //     }
  //   }
  //   init();
  // }, [l1Addr, l2Addr, inbox, l1Migrator, nodeInterface, l1Delegator]);

  return (
    <Container
      size="2"
      css={{
        maxWidth: 650,
        mt: "$8",
        width: "100%",
        "@bp3": {
          width: 650,
        },
      }}
    >
      <Card
        css={{
          p: "$5",
          borderRadius: "$4",
          backgroundColor: "$panel",
          border: "1px solid $neutral5",
          mb: "$8",
        }}
      >
        <Box css={{ mb: "$6" }}>
          <Heading css={{ mb: "$1" }}>
            Contract Wallet Stake Migration Tool
          </Heading>
          <Text variant="neutral">
            If you used a contract wallet (i.e. multisig) to stake on L1 this is
            a tool will generate the required parameters needed to submit any
            necessary migration transactions using the{" "}
            <LivepeerLink
              target="_blank"
              href={`${CHAIN_INFO[L1_CHAIN_ID].explorer}address/${CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator}#code`}
            >
              L1Migrator contract.
            </LivepeerLink>{" "}
          </Text>
        </Box>
        <Box css={{ mb: "$3" }}>
          <Text css={{ display: "block", mb: "$2" }}>
            Enter the address of your contract wallet on L1 that has stake to
            migrate
          </Text>
          <TextField
            ref={register}
            size="3"
            name="l1Addr"
            placeholder="L1 Address"
          />
        </Box>
        <Box>
          <Text css={{ display: "block", mb: "$2" }}>
            Enter the address that will receive migrated stake on L2
          </Text>
          <Text css={{ fontWeight: "bold", display: "block", mb: "$2" }}>
            This address should be different from the L1 address and you MUST
            verify you have access to it on L2
          </Text>
          <TextField
            ref={register}
            size="3"
            name="l2Addr"
            placeholder="L2 Address"
          />
        </Box>
        {loading && (
          <Flex align="center" justify="center" css={{ mt: "$3" }}>
            <Spinner />
          </Flex>
        )}
        {!loading && message && (
          <Text size="2" variant="neutral" css={{ mt: "$2" }}>
            {message}
          </Text>
        )}
        {!loading && params?.migrateDelegatorParams && (
          <Box css={{ mt: "$3" }}>
            <Text size="2" variant="neutral" css={{ mb: "$2" }}>
              The function <code>migrateDelegator</code> should be submitted
              with the following parameters:
            </Text>
            {Object.keys(params.migrateDelegatorParams).map((keyName, i) => (
              <ReadOnlyCard key={i} css={{ p: "$2", mb: "$1", fontSize: "$2" }}>
                <Box
                  css={{
                    fontFamily: "$mono",
                    fontWeight: 500,
                    color: "$neutral10",
                  }}
                >
                  {keyName}
                </Box>
                <Box
                  css={{
                    fontFamily: "$mono",
                  }}
                >
                  {params.migrateDelegatorParams[keyName]}
                </Box>
              </ReadOnlyCard>
            ))}
          </Box>
        )}
        {!loading && params?.migrateUnbondingLockParams && (
          <Box css={{ mt: "$3" }}>
            <Text size="2" variant="neutral" css={{ mb: "$2" }}>
              The function <code>migrateUnbondingLocks</code> should be
              submitted with the following parameters:
            </Text>
            {Object.keys(params.migrateUnbondingLockParams).map(
              (keyName, i) => (
                <ReadOnlyCard
                  key={i}
                  css={{ p: "$2", mb: "$1", fontSize: "$2" }}
                >
                  <Box
                    css={{
                      fontFamily: "$mono",
                      fontWeight: 500,
                      color: "$neutral10",
                    }}
                  >
                    {keyName}
                  </Box>
                  <Box
                    css={{
                      fontFamily: "$mono",
                    }}
                  >
                    {params.migrateUnbondingLockParams[keyName]}
                  </Box>
                </ReadOnlyCard>
              )
            )}
          </Box>
        )}
      </Card>
    </Container>
  );
};

// async function getMigrateDelegatorParams(
//   _l1Addr,
//   _l2Addr,
//   inbox: Inbox,
//   l1Migrator: L1Migrator,
//   nodeInterface: NodeInterface
// ) {
//   try {
//     const { data } = await l1Migrator.getMigrateDelegatorParams(
//       _l1Addr,
//       _l2Addr
//     );

//     const gasPriceBid = await l2Provider.getGasPrice();

//     // fetching submission price
//     // https://developer.offchainlabs.com/docs/l1_l2_messages#parameters
//     const submissionPrice = await inbox.calculateRetryableSubmissionFee(
//       data.length,
//       gasPriceBid // TODO change this to 0 to use the block.basefee once Nitro upgrades
//     );

//     // overpaying submission price to account for increase
//     // https://developer.offchainlabs.com/docs/l1_l2_messages#important-note-about-base-submission-fee
//     // the excess will be sent back to the refund address
//     const maxSubmissionPrice = submissionPrice.mul(4);

//     // calculating estimated gas for the tx
//     const estimatedGas =
//       await nodeInterface.estimateGas.estimateRetryableTicket(
//         CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
//         ethers.utils.parseEther("0.01"),
//         CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
//         0,
//         _l1Addr,
//         _l1Addr,
//         data
//       );

//     // overpaying gas just in case
//     // the excess will be sent back to the refund address
//     const maxGas = estimatedGas.mul(4);

//     // ethValue will be sent as callvalue
//     // this entire amount will be used for successfully completing
//     // the L2 side of the transaction
//     // maxSubmissionPrice + totalGasPrice (estimatedGas * gasPrice)
//     const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas));

//     return {
//       _l1Addr,
//       _l2Addr,
//       _sig: "Can be ignored and left blank",
//       _maxGas: maxGas.toString(),
//       _gasPriceBid: gasPriceBid.toString(),
//       _maxSubmissionPrice: maxSubmissionPrice.toString(),
//       ethValue: ethValue.toString(),
//     };
//   } catch (e) {
//     console.error(e);
//   }
// }

// async function getParams(
//   _l1Addr,
//   _l2Addr,
//   inbox: Inbox,
//   l1Migrator: L1Migrator,
//   nodeInterface: NodeInterface,
//   l1Delegator: L1Delegator
// ) {
//   const migrateDelegatorParams = await getMigrateDelegatorParams(
//     _l1Addr,
//     _l2Addr,
//     inbox,
//     l1Migrator,
//     nodeInterface
//   );
//   const migrateUnbondingLockParams = await getMigrateUnbondingLockParams(
//     _l1Addr,
//     _l2Addr,
//     inbox,
//     l1Migrator,
//     nodeInterface,
//     l1Delegator
//   );

//   return {
//     migrateDelegatorParams,
//     migrateUnbondingLockParams,
//   };
// }
// async function getMigrateUnbondingLockParams(
//   _l1Addr,
//   _l2Addr,
//   inbox: Inbox,
//   l1Migrator: L1Migrator,
//   nodeInterface: NodeInterface,
//   l1Delegator: L1Delegator
// ) {
//   try {
//     const locks = l1Delegator.activeLocks.map((e) => e.id);

//     // fetch calldata to be submitted for calling L2 function
//     const { data, params } = await l1Migrator.getMigrateUnbondingLocksParams(
//       _l1Addr,
//       _l2Addr,
//       locks
//     );

//     const gasPriceBid = await l2Provider.getGasPrice();

//     // fetching submission price
//     // https://developer.offchainlabs.com/docs/l1_l2_messages#parameters
//     const submissionPrice = await inbox.calculateRetryableSubmissionFee(
//       data.length,
//       gasPriceBid // TODO change this to 0 to use the block.basefee once Nitro upgrades
//     );

//     // overpaying submission price to account for increase
//     // https://developer.offchainlabs.com/docs/l1_l2_messages#important-note-about-base-submission-fee
//     // the excess will be sent back to the refund address
//     const maxSubmissionPrice = submissionPrice.mul(4);

//     // calculating estimated gas for the tx
//     const estimatedGas =
//       await nodeInterface.estimateGas.estimateRetryableTicket(
//         CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
//         ethers.utils.parseEther("0.01"),
//         CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
//         0,
//         _l1Addr,
//         _l1Addr,
//         data
//       );

//     // overpaying gas just in case
//     // the excess will be sent back to the refund address
//     const maxGas = estimatedGas.mul(4);

//     // ethValue will be sent as callvalue
//     // this entire amount will be used for successfully completing
//     // the L2 side of the transaction
//     // maxSubmissionPrice + totalGasPrice (estimatedGas * gasPrice)
//     const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas));

//     return {
//       _l1Addr,
//       _l2Addr,
//       _unbondingLockIds: JSON.stringify(
//         params.unbondingLockIds.map((lock) => +lock.toString())
//       ),
//       _sig: "Can be ignored and left blank",
//       _maxGas: maxGas.toString(),
//       _gasPriceBid: gasPriceBid.toString(),
//       _maxSubmissionPrice: maxSubmissionPrice.toString(),
//       ethValue: ethValue.toString(),
//     };
//   } catch (e) {
//     console.error(e);
//   }
// }

ContractWalletTool.getLayout = getLayout;

export default ContractWalletTool;
