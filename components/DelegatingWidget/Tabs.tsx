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
      marginBottom: "$3",
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
          ? "$primary11"
          : "$red11"
        : "$neutral10",
      paddingTop: "10px",
      paddingBottom: "10px",
      width: "50%",
      fontSize: "$3",
      borderRadius: "$4",
      fontWeight: 600,
      border: "2px solid",
      backgroundColor: "transparent",
      borderColor: props.isSelected
        ? props.children === "Delegate"
          ? "$primary11"
          : "$red11"
        : "transparent",
    }}
    {...props}
  />
);
