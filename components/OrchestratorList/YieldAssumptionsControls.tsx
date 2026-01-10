import {
  formatFactors,
  formatTimeHorizon,
  ROIFactors,
  ROIInflationChange,
  ROITimeHorizon,
} from "@lib/roi";
import {
  Badge,
  Box,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Flex,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  TextField,
} from "@livepeer/design-system";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { ProtocolQueryResult } from "apollo";
import numbro from "numbro";

import YieldChartIcon from "../../public/img/yield-chart.svg";

type YieldAssumptionsControlsProps = {
  principle: number;
  setPrinciple: (value: number) => void;
  timeHorizon: ROITimeHorizon;
  setTimeHorizon: (value: ROITimeHorizon) => void;
  factors: ROIFactors;
  setFactors: (value: ROIFactors) => void;
  inflationChange: ROIInflationChange;
  setInflationChange: (value: ROIInflationChange) => void;
  protocolData:
    | NonNullable<ProtocolQueryResult["data"]>["protocol"]
    | undefined;
  maxSupplyTokens: number;
  formatPercentChange: (change: ROIInflationChange) => string;
};

export function YieldAssumptionsControls({
  principle,
  setPrinciple,
  timeHorizon,
  setTimeHorizon,
  factors,
  setFactors,
  inflationChange,
  setInflationChange,
  protocolData,
  maxSupplyTokens,
  formatPercentChange,
}: YieldAssumptionsControlsProps) {
  return (
    <Box css={{ marginBottom: "$2" }}>
      <Flex css={{ alignItems: "center", marginBottom: "$2" }}>
        <Box css={{ marginRight: "$1", color: "$neutral11" }}>
          <YieldChartIcon />
        </Box>
        <Text
          variant="neutral"
          size="1"
          css={{
            marginLeft: "$1",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {"Forecasted Yield Assumptions"}
        </Text>
      </Flex>
      <Flex
        css={{
          flexWrap: "wrap",
          marginLeft: "-$1",
          marginTop: "-$1",
          "& > *": {
            marginLeft: "$1",
            marginTop: "$1",
          },
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => {
              e.stopPropagation();
            }}
            asChild
          >
            <Badge
              size="2"
              css={{
                cursor: "pointer",
                color: "$white",
                fontSize: "$2",
              }}
            >
              <Box css={{ marginRight: "$1" }}>
                <Pencil1Icon />
              </Box>

              <Text
                variant="neutral"
                size="1"
                css={{
                  marginRight: 3,
                }}
              >
                {"Time horizon:"}
              </Text>
              <Text
                size="1"
                css={{
                  color: "white",
                  fontWeight: 600,
                }}
              >
                {formatTimeHorizon(timeHorizon)}
              </Text>
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            css={{
              width: "200px",
              mt: "$1",
              boxShadow:
                "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
              bc: "$neutral4",
            }}
            align="center"
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
            placeholder={undefined}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem
                css={{
                  cursor: "pointer",
                }}
                onSelect={() => setTimeHorizon("half-year")}
              >
                {"6 months"}
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  cursor: "pointer",
                }}
                onSelect={() => setTimeHorizon("one-year")}
              >
                {"1 year"}
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  cursor: "pointer",
                }}
                onSelect={() => setTimeHorizon("two-years")}
              >
                {"2 years"}
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  cursor: "pointer",
                }}
                onSelect={() => setTimeHorizon("three-years")}
              >
                {"3 years"}
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  cursor: "pointer",
                }}
                onSelect={() => setTimeHorizon("four-years")}
              >
                {"4 years"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Box>
          <Popover>
            <PopoverTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              asChild
            >
              <Badge
                size="2"
                css={{
                  cursor: "pointer",
                  color: "$white",
                  fontSize: "$2",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  <Pencil1Icon />
                </Box>
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    marginRight: 3,
                  }}
                >
                  {"Delegation:"}
                </Text>
                <Text
                  size="1"
                  css={{
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  {numbro(principle).format({ mantissa: 1, average: true })}
                  {" LPT"}
                </Text>
              </Badge>
            </PopoverTrigger>
            <PopoverContent
              css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
              placeholder={undefined}
            >
              <Box
                css={{
                  borderBottom: "1px solid $neutral6",
                  padding: "$3",
                }}
              >
                <Flex align="center">
                  <TextField
                    name="principle"
                    placeholder="Amount in LPT"
                    type="number"
                    size="2"
                    value={principle}
                    onChange={(e) => {
                      setPrinciple(
                        Number(e.target.value) > maxSupplyTokens
                          ? maxSupplyTokens
                          : Number(e.target.value)
                      );
                    }}
                    min="1"
                    max={`${Number(protocolData?.totalSupply || 1e7).toFixed(
                      0
                    )}`}
                  />
                  <Text
                    variant="neutral"
                    size="3"
                    css={{
                      marginLeft: "$2",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    LPT
                  </Text>
                </Flex>
              </Box>
            </PopoverContent>
          </Popover>
        </Box>
        <Box>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              asChild
            >
              <Badge
                size="2"
                css={{
                  cursor: "pointer",
                  color: "$white",
                  fontSize: "$2",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  <Pencil1Icon />
                </Box>

                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    marginRight: 3,
                  }}
                >
                  {"Factors:"}
                </Text>
                <Text
                  size="1"
                  css={{
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  {formatFactors(factors)}
                </Text>
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              css={{
                width: "200px",
                mt: "$1",
                boxShadow:
                  "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                bc: "$neutral4",
              }}
              align="center"
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
              placeholder={undefined}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  css={{
                    cursor: "pointer",
                  }}
                  onSelect={() => setFactors("lpt+eth")}
                >
                  {formatFactors("lpt+eth")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  css={{
                    cursor: "pointer",
                  }}
                  onSelect={() => setFactors("lpt")}
                >
                  {formatFactors("lpt")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  css={{
                    cursor: "pointer",
                  }}
                  onSelect={() => setFactors("eth")}
                >
                  {formatFactors("eth")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Box>
        <Box>
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              asChild
            >
              <Badge
                size="2"
                css={{
                  cursor: "pointer",
                  color: "$white",
                  fontSize: "$2",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  <Pencil1Icon />
                </Box>

                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    marginRight: 3,
                  }}
                >
                  {"Inflation change:"}
                </Text>
                <Text
                  size="1"
                  css={{
                    color: "white",
                    fontWeight: 600,
                  }}
                >
                  {formatPercentChange(inflationChange)}
                </Text>
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              css={{
                width: "200px",
                mt: "$1",
                boxShadow:
                  "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                bc: "$neutral4",
              }}
              align="center"
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
              placeholder={undefined}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  css={{
                    cursor: "pointer",
                  }}
                  onSelect={() => setInflationChange("none")}
                >
                  {formatPercentChange("none")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  css={{
                    cursor: "pointer",
                  }}
                  onSelect={() => setInflationChange("positive")}
                >
                  {formatPercentChange("positive")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  css={{
                    cursor: "pointer",
                  }}
                  onSelect={() => setInflationChange("negative")}
                >
                  {formatPercentChange("negative")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </Box>
      </Flex>
    </Box>
  );
}
