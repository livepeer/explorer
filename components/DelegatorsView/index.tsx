import DelegatorList from "@components/DelegatorList";
import { Box } from "@livepeer/design-system";
import {
  AccountQueryResult,
  Delegator_OrderBy,
  OrderDirection,
  useOrchestratorDelegatorsQuery,
} from "apollo";

interface Props {
  transcoder?: NonNullable<AccountQueryResult["data"]>["transcoder"];
}

const DelegatorsView = ({ transcoder }: Props) => {
  const { data } = useOrchestratorDelegatorsQuery({
    variables: {
      id: transcoder?.id ?? "",
      first: 1000,
      orderBy: Delegator_OrderBy.BondedAmount,
      orderDirection: OrderDirection.Desc,
    },
    skip: !transcoder?.id,
  });

  return (
    <Box css={{ paddingTop: "$4" }}>
      <DelegatorList data={data?.transcoder?.delegators} />
    </Box>
  );
};

export default DelegatorsView;
