import Link from "next/link";
import AccountIcon from "../../public/img/account.svg";
import { useRef } from "react";
import { useRouter } from "next/router";
import { Box, Flex, Link as A } from "@livepeer/design-system";

import { useAccountAddress, useAccountEnsData } from "hooks";

const Account = () => {
  const router = useRouter();
  const ens = useAccountEnsData();
  const { asPath } = router;
  const ref = useRef();

  const accountAddress = useAccountAddress();

  return accountAddress ? (
    <Box ref={ref} css={{ position: "relative" }}>
      <Flex css={{ alignItems: "center" }}>
        <Link href={`/accounts/${accountAddress}/delegating`} passHref>
          <A
            variant="subtle"
            css={{
              color:
                asPath.split("?")[0] ===
                `/accounts/${accountAddress}/delegating`
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
            }}
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
            <Box>
              {ens?.name
                ? ens.name
                : accountAddress.replace(accountAddress.slice(6, 38), "…")}
            </Box>
          </A>
        </Link>
      </Flex>
    </Box>
  ) : (
    <></>
  );
};

export default Account;
