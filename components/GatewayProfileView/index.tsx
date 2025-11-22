import Stat from "@components/Stat";
import { Box, Flex, Grid } from "@livepeer/design-system";
import dayjs from "@lib/dayjs";
import numbro from "numbro";
import { useMemo } from "react";
import { GatewaysQuery } from "apollo";

const formatEth = (value?: string | number | null) => {
  const amount = Number(value ?? 0) || 0;
  return `${numbro(amount).format(
    amount > 0 && amount < 0.01
      ? { mantissa: 4, trimMantissa: true }
      : { mantissa: 2, average: true, lowPrecision: false }
  )} ETH`;
};

const BroadcastingView = ({
  gateway,
}: {
  gateway?: GatewaysQuery["gateways"] extends Array<infer G> ? G | null : null;
}) => {
  const isActive = useMemo(
    () => Number(gateway?.ninetyDayVolumeETH ?? 0) > 0,
    [gateway?.ninetyDayVolumeETH]
  );
  const activeSince = useMemo(
    () =>
      gateway?.firstActiveDay
        ? dayjs.unix(gateway.firstActiveDay).format("MMM D, YYYY")
        : "Pending graph update",
    [gateway?.firstActiveDay]
  );
  const statusText = useMemo(() => {
    if (isActive && gateway?.lastActiveDay) {
      return `Active ${dayjs.unix(gateway.lastActiveDay).fromNow(true)}`;
    }
    return "Inactive";
  }, [gateway?.lastActiveDay, isActive]);
  const statItems = useMemo(
    () => [
      {
        label: "Total fees distributed",
        value: formatEth(gateway?.totalVolumeETH),
        tooltip: "Lifetime fees this gateway has distributed on-chain.",
      },
      {
        label: "Status",
        value: statusText,
        tooltip:
          "Gateways are marked active if they have distributed fees in the past 90 days.",
      },
      {
        label: "90d fees distributed",
        value: formatEth(gateway?.ninetyDayVolumeETH),
        tooltip: "Total fees distributed to orchestrators over the last 90 days.",
      },
      {
        label: "Activation date",
        value: activeSince,
        tooltip: "First day this gateway funded deposit/reserve on-chain.",
      },
      {
        label: "Deposit balance",
        value: formatEth(gateway?.deposit),
        tooltip: "Current deposit balance funded for gateway job payouts.",
      },
      {
        label: "Reserve balance",
        value: formatEth(gateway?.reserve),
        tooltip: "Reserve funds available for winning ticket payouts.",
      },
    ],
    [
      activeSince,
      gateway?.deposit,
      gateway?.ninetyDayVolumeETH,
      gateway?.reserve,
      gateway?.totalVolumeETH,
      statusText,
    ]
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
            key={stat.label}
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
