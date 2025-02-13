import Spinner from "@components/Spinner";
import {
  Box,
  Card as CardBase,
  Flex,
  Link as A,
  styled,
} from "@livepeer/design-system";
import { ExternalLinkIcon } from "@modulz/radix-icons";
import { useTransactionsQuery } from "apollo";
import dayjs from "dayjs";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { useRouter } from "next/router";
import numeral from "numeral";
import { useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const Card = styled(CardBase, {
  length: {},
  border: "1px solid $neutral3",
  mb: "$2",
  p: "$4",
});

const Index = () => {
  const router = useRouter();
  const query = router.query;
  const account = query.account as string;

  const firstData = [
    {
      title: "Proposals voted on",
      data: "45",
    },
    {
      title: "Voting turnout",
      data: "72.18 %",
    }
  ]



  const SecondData = [
    {
      title: "Livepeer LLM SPE",
      dateAndTime: "08/27/2024 9:32:40 am - Round #3497",
      status: "Active",
      orchestratorId: "0xf4e8ef0763bcb2b1af693f5970a00050a6ac7e1b"
    },
    {
      title: "Livepeer LLM SPE",
      dateAndTime: "08/27/2024 9:32:40 am - Round #3497",
      status: "Defeated",
      orchestratorId: "0xf4e8ef0763bcb2b1af693f5970a00050a6ac7e1b"
    },
    {
      title: "Livepeer LLM SPE",
      dateAndTime: "08/27/2024 9:32:40 am - Round #3497",
      status: "Executed",
      orchestratorId: "0xf4e8ef0763bcb2b1af693f5970a00050a6ac7e1b"
    },
  ]

  const getBackgroundColorByStatus = (status: string) => {
    let bgColor = "#212322";
    switch (status) {
      case "Active":
        bgColor = "#16271F"
        break;
      case "Defeated":
        bgColor = "#321C1D";
        break;
      case "Executed":
        bgColor = "#212322";
        break;
      default:
        break;
    }
    return bgColor;
  }

  function shortenAddress(address:string) {
    if (address.length < 10) return address; // Handle short addresses

    const first = address.slice(0, 6); // Get the '0x' + first 4 characters
    const last = address.slice(-4);    // Get last 4 characters

    return `${first}...${last}`;        // Return formatted string
}


  const { data, loading, error, fetchMore, stopPolling } = useTransactionsQuery(
    {
      variables: {
        account: account.toLowerCase(),
        first: 10,
        skip: 0,
      },
      notifyOnNetworkStatusChange: true,
    }
  );

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20 }}>
        {firstData.map(el => {
          return (
            <div style={{ padding: 20, backgroundColor: "#191D1B", width: 300, marginRight: 15, borderRadius: 8 }}>
              <div style={{color:"#66736D", fontSize:13}}>{el.title.toUpperCase()}</div>
              <div style={{fontSize:27}}>{el.data}</div>
            </div>

          )
        })}
      </div>
      <div style={{marginTop: 20 }}>
        {SecondData.map(el => {
          return (
            <div style={{ padding: 20, backgroundColor: getBackgroundColorByStatus(el.status), width: 945, marginTop: 15, borderRadius: 8 }}>
              <div>{el.title}</div>
              <div>{el.dateAndTime}</div>
              <div>Proposed by <a style={{ color:'inherit'}} href={`https://explorer.livepeer.org/accounts/${el.orchestratorId}/delegating`}>livepeer.eth</a></div>
              <div>{el.status}</div>
              <div><a style={{textDecoration:'none', color:'inherit'}} href={`https://explorer.livepeer.org/accounts/${el.orchestratorId}/delegating`}>{shortenAddress(el.orchestratorId)}</a></div>
            </div>

          )
        })}
      </div>
    </div>
  )
};

export default Index;

// function renderSwitch(event: any, i: number) {
//   switch (event.__typename) {
//     case "BondEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>
//                 Delegated with{" "}
//                 {event.newDelegate.id.replace(
//                   event.newDelegate.id.slice(7, 37),
//                   "…"
//                 )}
//               </Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 +{numeral(event.additionalAmount).format("0.0a")}
//               </Box>{" "}
//               LPT
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "NewRoundEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>Initialized round</Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               Round #
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 {event.round.id}
//               </Box>
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "RebondEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>
//                 Redelegated with{" "}
//                 {event.delegate.id.replace(event.delegate.id.slice(7, 37), "…")}
//               </Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 +{numeral(event.amount).format("0.0a")}
//               </Box>{" "}
//               LPT
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "UnbondEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>
//                 Undelegated from{" "}
//                 {event.delegate.id.replace(event.delegate.id.slice(7, 37), "…")}
//               </Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 -{numeral(event.amount).format("0.0a")}
//               </Box>{" "}
//               LPT
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "RewardEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>
//                 Claimed inflationary token reward
//               </Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 +{numeral(event.rewardTokens).format("0.00a")}
//               </Box>{" "}
//               LPT
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "TranscoderUpdateEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>Updated orchestrator cut</Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ textAlign: "right", fontSize: "$2", ml: "$4" }}>
//               <Box>
//                 <Box as="span" css={{ fontWeight: 600 }}>
//                   {event.rewardCut / 10000}% R
//                 </Box>{" "}
//               </Box>
//               <Box>
//                 <Box as="span" css={{ fontWeight: 600 }}>
//                   {(100 - event.feeShare / 10000)
//                     .toFixed(2)
//                     .replace(/[.,]00$/, "")}
//                   % F
//                 </Box>{" "}
//               </Box>
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "WithdrawStakeEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>Withdrew undelegated tokens</Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 {numeral(event.amount).format("0.00a")}
//               </Box>{" "}
//               LPT
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "WithdrawFeesEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>Withdrew earned fees</Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 {numeral(event.amount).format("0.000a")}
//               </Box>{" "}
//               ETH
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "WinningTicketRedeemedEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>Redeemed winning ticket</Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 +{numeral(event.faceValue).format("0.000a")}
//               </Box>{" "}
//               ETH
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "DepositFundedEvent":
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>Deposit funded</Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 +{numeral(event.amount).format("0.00a")}
//               </Box>{" "}
//               ETH
//             </Box>
//           </Flex>
//         </Card>
//       );
//     case "ReserveFundedEvent":
//       // Ignore funded reserve events where amount is 0
//       // (unable to do this on the graphql query as of now)
//       if (+event.amount === 0) {
//         return;
//       }
//       return (
//         <Card
//           as={A}
//           key={i}
//           href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
//           target="_blank"
//           rel="noopener noreferrer"
//           css={{
//             textDecoration: "none",
//             "&:hover": {
//               textDecoration: "none",
//             },
//           }}
//         >
//           <Flex
//             css={{
//               width: "100%",
//               alignItems: "center",
//               justifyContent: "space-between",
//             }}
//           >
//             <Box>
//               <Box css={{ fontWeight: 500 }}>Reserve funded</Box>
//               <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
//                 {dayjs
//                   .unix(event.transaction.timestamp)
//                   .format("MM/DD/YYYY h:mm:ss a")}{" "}
//                 - Round #{event.round.id}
//               </Box>
//               <Flex
//                 css={{
//                   ai: "center",
//                   mt: "$2",
//                   fontSize: "$1",
//                   color: "$neutral11",
//                 }}
//               >
//                 <Box css={{ mr: "$1" }}>
//                   {event.transaction.id.replace(
//                     event.transaction.id.slice(6, 62),
//                     "…"
//                   )}
//                 </Box>
//                 <ExternalLinkIcon />
//               </Flex>
//             </Box>
//             <Box css={{ fontSize: "$3", ml: "$4" }}>
//               {" "}
//               <Box as="span" css={{ fontWeight: 600 }}>
//                 +{numeral(event.amount).format("0.00a")}
//               </Box>{" "}
//               ETH
//             </Box>
//           </Flex>
//         </Card>
//       );
//     default:
//       return null;
//   }
// }
