import dayjs from "@lib/dayjs";
import { useGatewaySelfRedeemQuery } from "apollo";

export const useGatewaySelfRedeemStatus = (
  gatewayId?: string | null,
  windowDays = 90
): boolean => {
  const account = gatewayId?.toLowerCase();
  const { data } = useGatewaySelfRedeemQuery({
    variables: { account: account ?? "" },
    skip: !account,
  });

  const cutoff = dayjs().subtract(windowDays, "day").unix();
  const lastTimestamp = Number(
    data?.winningTicketRedeemedEvents?.[0]?.transaction?.timestamp ?? 0
  );

  return lastTimestamp >= cutoff;
};
