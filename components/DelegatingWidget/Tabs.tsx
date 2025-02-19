import {
  Tabs as ReachTabs,
  TabList as ReachTabList,
  Tab as ReachTab,
} from "@reach/tabs";
import { Box } from "@jjasonn.stone/design-system";

export const Tabs = (props) => <ReachTabs {...props} />;

export const TabList = (props) => (
  <Box
    as={ReachTabList}
    css={{
      bc: "$neutral3",
      display: "flex",
      alignItems: "center",
      width: "100%",
      position: "relative",
      borderRadius: "$4",
      mb: "$3",
    }}
    {...props}
  />
);

export const Tab = (props) => (
  <Box
    as={ReachTab}
    css={{
      flex: 1,
      outline: "none",
      cursor: props?.disabled ? "not-allowed" : "pointer",
      textAlign: "center",
      color: props.isSelected
        ? props.children === "Delegate"
          ? "$green10"
          : "$red10"
        : "$neutral10",
      py: "10px",
      width: "50%",
      fontSize: "$3",
      borderRadius: "$4",
      fontWeight: 600,
      border: "2px solid",
      bc: "transparent",
      borderColor: props.isSelected
        ? props.children === "Delegate"
          ? "$green10"
          : "$red10"
        : "transparent",
    }}
    {...props}
  />
);
