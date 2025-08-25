import { ExplorerTooltip } from "@components/ExplorerTooltip";
import {
  Heading,
  Text,
  Card,
  Box,
  Flex,
  Skeleton,
} from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { ReactNode } from "react";

type Props = {
  label: ReactNode;
  meta?: ReactNode;
  tooltip?: ReactNode;
  value?: ReactNode | null;
  variant?: "ghost" | "interactive" | "active";
  css?: object | null;
  className?: string | null;
};
const Stat = ({
  label,
  value,
  meta,
  tooltip,
  variant = "active",
  css = null,
  className = null,
}: Props) => (
  <Card
    variant={variant}
    className={className ?? ""}
    css={{
      color: "$neutral9",
      padding: "$3",
      boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
      ...css,
    }}
  >
    <Heading
      css={{
        fontSize: "$2",
        color: "$neutral9",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      <Flex css={{ alignItems: "center" }}>
        {label}
        {tooltip && (
          <ExplorerTooltip multiline content={tooltip}>
            <Flex css={{ marginLeft: "$1" }}>
              <Box as={QuestionMarkCircledIcon} css={{ color: "$neutral11" }} />
            </Flex>
          </ExplorerTooltip>
        )}
      </Flex>
    </Heading>
    <Text size="7" css={{ fontWeight: 600 }}>
      {value ? (
        <Box css={{ color: "$hiContrast" }}>{value}</Box>
      ) : (
        <Skeleton css={{ marginTop: "$1", height: 35, width: 100, borderRadius: 8 }} />
      )}
    </Text>
    {meta && <Box css={{ marginTop: "$1", color: "$hiContrast" }}>{meta}</Box>}
  </Card>
);

export default Stat;
