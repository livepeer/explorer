import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Stat from "@components/Stat";
import dayjs from "@lib/dayjs";
import { formatEth } from "@lib/utils";
import { Box, Grid } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { GatewaysQuery } from "apollo";
import { useGatewaySelfRedeemStatus } from "hooks";
import { useMemo } from "react";

const SelfRedeemIndicator = () => (
  <ExplorerTooltip
    multiline
    content={
      <Box>Self-redeemed winning tickets detected in the last 90 days.</Box>
    }
  >
    <Box as={ExclamationTriangleIcon} css={{ color: "$amber11" }} />
  </ExplorerTooltip>
);

const BroadcastingView = ({
  gateway,
  isSelfRedeeming: isSelfRedeemingProp,
}: {
  gateway?: GatewaysQuery["gateways"] extends Array<infer G> ? G | null : null;
  isSelfRedeeming?: boolean;
}) => {
  const isSelfRedeemingFromHook = useGatewaySelfRedeemStatus(
    isSelfRedeemingProp === undefined ? gateway?.id : undefined
  );
  const isSelfRedeeming = isSelfRedeemingProp ?? isSelfRedeemingFromHook;

  const activeSince = useMemo(
    () =>
      gateway?.firstActiveDay
        ? dayjs.unix(gateway.firstActiveDay).format("MMM D, YYYY")
        : "Pending graph update",
    [gateway]
  );
  const statusText = useMemo(() => {
    const active = Number(gateway?.ninetyDayVolumeETH ?? 0) > 0;
    return active ? "Active" : "Inactive";
  }, [gateway]);
  const statItems = useMemo(
    () => [
      {
        id: "total-fees-distributed",
        label: "Total fees distributed",
        value: (
          <Box
            css={{ display: "inline-flex", alignItems: "center", gap: "$3" }}
          >
            <Box>{formatEth(gateway?.totalVolumeETH)}</Box>
            {isSelfRedeeming && <SelfRedeemIndicator />}
          </Box>
        ),
        tooltip: "Lifetime fees this gateway has distributed on-chain.",
      },
      {
        id: "status",
        label: "Status",
        value: statusText,
        tooltip: "Active if this gateway distributed fees in the last 90 days.",
      },
      {
        id: "ninety-day-fees",
        label: "90d fees distributed",
        value: formatEth(gateway?.ninetyDayVolumeETH),
        tooltip:
          "Total fees distributed to orchestrators over the last 90 days.",
      },
      {
        id: "activation-date",
        label: "Activation date",
        value: activeSince,
        tooltip: "First day this gateway funded deposit/reserve on-chain.",
      },
      {
        id: "deposit-balance",
        label: "Deposit balance",
        value: formatEth(gateway?.deposit),
        tooltip: "Current deposit balance funded for gateway job payouts.",
      },
      {
        id: "reserve-balance",
        label: "Reserve balance",
        value: formatEth(gateway?.reserve),
        tooltip: "Reserve funds available for winning ticket payouts.",
      },
    ],
    [gateway, activeSince, statusText, isSelfRedeeming]
  );

  return (
    <Box
      css={{
        paddingTop: "$4",
      }}
    >
      <Grid
        css={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "$3",
          alignItems: "stretch",
          "@media (min-width: 820px)": {
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          },
        }}
      >
        {statItems.map((stat) => (
          <Stat
            key={stat.id}
            label={stat.label}
            value={stat.value}
            tooltip={stat.tooltip}
            css={{ height: "100%" }}
          />
        ))}
      </Grid>
    </Box>
  );
};

export default BroadcastingView;
