import { useState, useEffect, useRef } from "react";
import { ResponsiveContainer } from "recharts";
import TradingviewChart, { CHART_TYPES } from "../TradingviewChart";
import { Skeleton, Box } from "@livepeer/design-system";

const GlobalChart = ({ data, display, title, field, unit = "" }) => {
  // update the width on a window resize
  const ref = useRef(null);
  const isClient = typeof window === "object";
  const [width, setWidth] = useState(ref?.current?.container?.clientWidth);

  useEffect(() => {
    if (!isClient) {
      return;
    }
    function handleResize() {
      setWidth(ref?.current?.container?.clientWidth ?? width);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient, width]);

  if (!data) {
    return <SkeletonChart />;
  }

  return (
    <>
      {display === "area" && (
        <ResponsiveContainer aspect={60 / 28} ref={ref}>
          <TradingviewChart
            data={data.chartData.dayData}
            base={data.chartData.participationRate}
            baseChange={data.chartData.participationRateChange}
            title={title}
            unit={unit}
            field={field}
            width={width}
            type={CHART_TYPES.AREA}
          />
        </ResponsiveContainer>
      )}
      {display === "volume" && (
        <ResponsiveContainer aspect={60 / 28}>
          <TradingviewChart
            data={data.chartData.weeklyData}
            base={
              unit === "minutes"
                ? data.chartData.oneWeekUsage
                : data.chartData.oneWeekVolumeUSD
            }
            baseChange={
              unit === "minutes"
                ? data.chartData.weeklyUsageChange
                : data.chartData.weeklyVolumeChangeUSD
            }
            title={title}
            unit={unit}
            field={field}
            width={width}
            type={CHART_TYPES.BAR}
            useWeekly={true}
          />
        </ResponsiveContainer>
      )}
    </>
  );
};

export default GlobalChart;

function SkeletonChart() {
  return (
    <Box css={{ width: "100%" }}>
      <Box css={{ mt: "$6" }}>
        <Skeleton
          variant="title"
          css={{
            width: "100%",
            mb: "$2",
            bc: "$neutral4",
            "&::after": {
              bc: "$neutral6",
            },
          }}
        />
        <Skeleton
          variant="heading"
          css={{
            width: "80%",
            mb: "$2",
            bc: "$neutral4",
            "&::after": {
              bc: "$neutral6",
            },
          }}
        />
        <Skeleton
          variant="text"
          css={{
            width: "60%",
            mb: "$2",
            bc: "$neutral4",
            "&::after": {
              bc: "$neutral6",
            },
          }}
        />
      </Box>
      <Box
        as="svg"
        role="img"
        viewBox="0 0 578 320"
        preserveAspectRatio="none"
        css={{ display: "flex", color: "$neutral5" }}
      >
        <rect
          x="0"
          y="0"
          width="578"
          height="320"
          clipPath="url(#xcrn0q9vx9)"
          style={{ fill: 'url("#dx9x6s6reg")' }}
        ></rect>
        <defs>
          <clipPath id="xcrn0q9vx9">
            <path d="M0.149069 218.737L8.71749 221.914L18.971 218.737L23.2822 214.668L28.5436 204.069L33.2181 211.763L41.2699 214.668L47.6741 205.411L55.1397 206.753L65.2365 167.667L70.6994 173.393L80.6587 154L95.8878 219.766L111.107 174.397L120.043 204.069L135.567 195.01L144.509 185.741L149.316 197.914L154.861 195.01L164.968 183.495L174.285 193.775L182.389 199.229L192.572 183.495L199.887 184.222L209.266 171.208H219.439L227.279 175.173L234.065 183.495L240.891 181.663L247.516 191.57H268.167L288.867 175.173L299.908 161.483H312.907L323.934 180.996L336.639 177.614L342.832 171.796L365.15 186.857L379.042 181.663L385.436 211.183L398.49 208.11L407.019 194.326L411.805 178.632L425.63 188.953L433.896 216.329L441.679 156.784L448.67 167.667L451.629 171.208L456.876 191.663L467.608 178.827L473.935 181.053L477.714 177.614L481.032 194.06L489.06 178.632L495.076 199.229L505.231 165.346L522.562 184.842L529.522 167.808L541.881 181.663L552.592 175.173L567.438 171.208L578 186.857V275H0L0.149069 218.737Z"></path>
          </clipPath>
          <linearGradient id="dx9x6s6reg">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1">
              <animate
                attributeName="offset"
                values="-2; -2; 1"
                keyTimes="0; 0.25; 1"
                dur="undefineds"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor="currentColor" stopOpacity="1">
              <animate
                attributeName="offset"
                values="-1; -1; 2"
                keyTimes="0; 0.25; 1"
                dur="undefineds"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="currentColor" stopOpacity="1">
              <animate
                attributeName="offset"
                values="0; 0; 3"
                keyTimes="0; 0.25; 1"
                dur="undefineds"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      </Box>
    </Box>
  );
}
