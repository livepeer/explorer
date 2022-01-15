import {
  Tabs as ReachTabs,
  TabList as ReachTabList,
  Tab as ReachTab,
} from "@reach/tabs";
import { Box } from "@livepeer/design-system";

export const Tabs = (props) => <ReachTabs {...props} />;

export const TabList = (props) => (
  <Box
    as={ReachTabList}
    css={{
      backgroundColor: "$neutral3",
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
      cursor: "pointer",
      textAlign: "center",
      color: props.isSelected ? "$primary11" : "$neutral10",
      py: "10px",
      width: "50%",
      fontSize: "$3",
      borderRadius: "$4",
      fontWeight: 600,
      border: "2px solid",
      backgroundColor: "transparent",
      borderColor: props.isSelected ? "$primary11" : "transparent",
    }}
    {...props}
  />
);
