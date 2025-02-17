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
import { CUBE_TYPE, getCubeData } from "cube/cube-client";
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


const fetchingData = async()=>{
  const response = await getCubeData({
    "measures": [
        "IcpSystemParameters.count"
    ],
    "timeDimensions": [
        {
            "dimension": "IcpSystemParameters.date"
        }
    ],
    "order": {
        "IcpSystemParameters.count": "desc"
    },
    "dimensions": [
        "IcpSystemParameters.canister_id"
    ]
}, { type: CUBE_TYPE.SERVER })
const CUBE_BASE_URL = process.env.CUBE_BASE_URL!;
console.log('response from cube CUBE_BASE_URL', response,CUBE_BASE_URL);
}

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20 }}>
        <button onClick={()=>fetchingData()}>
          get Data
        </button>
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

