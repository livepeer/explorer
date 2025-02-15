import AccountIcon from "../../public/img/account.svg";
import { useRef, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Box, Flex, Link as A } from "@jjasonn.stone/design-system";
import { useAccountAddress, useEnsData } from "hooks";

type AccountProps = {
  className?: string;
};

const PlaceholderBox = () => (
  <Box css={{ position: "relative" }} />
);

const Account = ({ className }: AccountProps) => {
  const router = useRouter();
  const accountAddress = useAccountAddress();
  const ens = useEnsData(accountAddress);
  const { asPath } = router;
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const linkStyles = useMemo(() => ({
    color: asPath.split("?")[0] === `/accounts/${accountAddress}/delegating`
      ? "$hiContrast"
      : "$neutral11",
    display: "flex",
    fontSize: "$3",
    fontWeight: 500,
    cursor: "pointer",
    alignItems: "center",
    py: "$2",
    transition: "color .3s",
    "&:hover": {
      textDecoration: "none",
      color: "$hiContrast",
      transition: "color .3s",
    },
  }), [asPath, accountAddress]);

  const displayAddress = useMemo(() => 
    ens?.name || accountAddress?.replace(accountAddress.slice(6, 38), "…") || "",
    [ens?.name, accountAddress]
  );

  if (!mounted || !accountAddress) {
    return <PlaceholderBox />;
  }

  return (
    <Box ref={ref} css={{ position: "relative" }} className={className}>
      <Flex css={{ alignItems: "center" }}>
        <A
          href={`/accounts/${accountAddress}/delegating`}
          variant="subtle"
          css={linkStyles}
        >
          <Flex
            css={{
              width: 18,
              height: 18,
              mr: "$2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AccountIcon />
          </Flex>
          <Box>{displayAddress}</Box>
        </A>
      </Flex>
    </Box>
  );
};

export default Account;