import {
  Card as CardBase,
  Link as A,
  styled,
  Flex,
} from "@livepeer/design-system";
import { CUBE_TYPE, getCubeData } from "cube/cube-client";
import { getAccountVotingHistory } from "cube/queryGenrator";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import Spinner from "@components/Spinner";


const Index = () => {
  const router = useRouter();
  const query = router.query;
  const account = query.account as string;

  const [votingTurnOut, setVotingTurnOut] = useState();
  const [votingData, setVotingData] = useState()
  const [isLoading, setIsLoading] = useState(false);
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

  function shortenAddress(address: string) {
    if (address.length < 10) return address; // Handle short addresses

    const first = address.slice(0, 6); // Get the '0x' + first 4 characters
    const last = address.slice(-4);    // Get last 4 characters

    return `${first}...${last}`;        // Return formatted string
  }



  const fetchingData = async () => {
    setIsLoading(true);
    try {
      const query = getAccountVotingHistory(account);
      const response = await getCubeData(query, { type: CUBE_TYPE.SERVER });
      const data = response[0].data;
      if (data.length > 0) {
        setVotingTurnOut(data[0]['LivepeerVoteType.votingTurnout']);
        setVotingData(data);
      }
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchingData();
  }, [])

  const getDateTimeAndRound = (date: string, round: string): string => {
    // Parse the date string to a Date object
    const dateObj = new Date(date);

    // Function to format the date to "MM/DD/YYYY h:mm:ss a"
    const formatDate = (date: Date): string => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const ampm = hours >= 12 ? 'pm' : 'am';

      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const formattedTime = `${month} ${day}, ${year} ${hours % 12 || 12}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} ${ampm}`;

      return formattedTime;
    };

    // Round logic (In case the round value needs transformation, it's done here)
    const roundNumber = round.split("-")[0]; // Assuming round is in the format "3466-01-01T00:00:00.000", just using the first part

    // Format date
    const formattedDate = formatDate(dateObj);

    // Return the final output in the required format
    return `${formattedDate} - Round #${roundNumber}`;
  }

  if (isLoading) {
    return (
      <Flex
        css={{
          pt: "$5",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner />
      </Flex>
    )
  }
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20 }}>

        <div style={{ padding: 20, backgroundColor: "#191D1B", width: 300, marginRight: 15, borderRadius: 8 }}>
          <div style={{ display: "flex", flexDirection: 'row' }}>
            <div style={{ color: "#66736D", fontSize: 13, }}>PROPOSALS VOTED ON</div>
            <div style={{ height: 14, width: 14, marginLeft: 10 }}>
              <QuestionMarkCircledIcon style={{ color: "#66736D" }} />
            </div>
          </div>
          <div style={{ fontSize: 27, marginTop: 6 }}>5</div>
        </div>

        <div style={{ padding: 20, backgroundColor: "#191D1B", width: 300, marginRight: 15, borderRadius: 8 }}>
          <div style={{ display: "flex", flexDirection: 'row' }}>
            <div style={{ color: "#66736D", fontSize: 13, }}>VOTING TURNOUT</div>
            <div style={{ height: 14, width: 14, marginLeft: 10 }}>
              <QuestionMarkCircledIcon style={{ color: "#66736D" }} />
            </div>
          </div>
          <div style={{ fontSize: 27, marginTop: 6 }}>{votingTurnOut}</div>
        </div>

      </div>
      <div style={{ marginTop: 20 }}>
        {votingData &&
          // @ts-ignore
          votingData.map((el, index) => {
            return (
              <div key={index} style={{ padding: 20, backgroundColor: getBackgroundColorByStatus(el.status), marginTop: 15, borderRadius: 8 }}>
                <div style={{ fontSize: 16, marginBottom: 12 }}>{el['LivepeerVoteType.nameOfProposal']}</div>
                <div style={{ fontSize: 12, marginBottom: 12 }}>{getDateTimeAndRound(el['LivepeerVoteType.date'], el['LivepeerVoteType.round'])}</div>
                <div style={{ fontSize: 12, marginBottom: 12 }}>Proposed by <a style={{ color: 'inherit' }} href={`https://explorer.livepeer.org/accounts/${el.orchestratorId}/delegating`}>livepeer.eth</a></div>
                {/* <div>{el.status}</div> */}
                <div><a style={{ textDecoration: 'none', color: 'inherit' }} href={`https://explorer.livepeer.org/accounts/${el['LivepeerVoteType.voter']}/delegating`}>{shortenAddress(el['LivepeerVoteType.voter'])}</a></div>
              </div>
            )
          })}
      </div>
    </div>
  )
};

export default Index;
