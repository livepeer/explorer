import Link from "next/link";
import { Link as A, Box } from "@livepeer/design-system";
export interface TabType {
  name: string;
  href: string;
  as: string;
  isActive?: boolean;
}

const Index = ({ tabs, ...props }) => {
  return (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        position: "relative",
        borderBottom: "1px solid",
        borderColor: "$neutral6",
      }}
      {...props}
    >
      {tabs.map((tab: TabType, i: number) => (
        <Link key={i} href={tab.href} as={tab.as} passHref>
          <A
            variant="subtle"
            css={{
              color: tab.isActive ? "$hiContrast" : "$neutral11",
              mr: "$4",
              pb: "$2",
              fontSize: "$3",
              fontWeight: 500,
              borderBottom: "2px solid",
              borderColor: tab.isActive ? "$primary11" : "transparent",
              "&:hover": {
                textDecoration: "none",
              },
            }}
          >
            {tab.name}
          </A>
        </Link>
      ))}
    </Box>
  );
};

export default Index;
