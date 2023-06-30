import Spinner from "@components/Spinner";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTrigger,
  Flex,
  IconButton,
  Link as A,
  Text,
  TextField
} from "@livepeer/design-system";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@modulz/radix-icons";
import Fuse from "fuse.js";
import { useAllEnsData } from "hooks";
import { useMemo, useState } from "react";

const Index = ({ css = {}, ...props }) => {
  const [search, setSearch] = useState("");
  const accounts = useAllEnsData();

  const fuse = useMemo(
    () =>
      new Fuse(accounts, {
        keys: [
          "id",
          "name",
          {
            name: "twitter",
            weight: 0.5,
          },
          {
            name: "url",
            weight: 0.5,
          },
          {
            name: "description",
            weight: 0.2,
          },
        ],
      }),
    [accounts]
  );

  const searchMapping = useMemo(
    () => (search ? fuse.search(search, { limit: 15 }) : []),
    [fuse, search]
  );

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setSearch("");
        }
      }}
    >
      <DialogTrigger asChild>
        <IconButton
          size="3"
          aria-label="Orchestrator actions"
          css={{
            cursor: "pointer",
            ml: "$3",
            opacity: 1,
            transition: "background-color .3s",
            border: "1px solid $neutral4",
            bc: "$neutral4",
            "&:hover": {
              bc: "hsla(0,100%,100%,.1)",
            },
          }}
        >
          <Box as={MagnifyingGlassIcon} css={{ width: 18, height: 18 }} />
        </IconButton>
      </DialogTrigger>
      <DialogContent css={{ overflow: "scroll", transition: "max-height 2s" }}>
        <Box
          css={{
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            width: "80vw",
            maxWidth: 700,
            position: "relative",
            ...css,
          }}
          {...props}
        >
          <Box
            css={{
              position: "absolute",
              left: "$2",
              mr: "$1",
              display: "flex",
              alignItems: "center",
              bc: "transparent",
              p: 0,
              width: "$5",
              height: "$5",
            }}
          >
            {accounts.length <= 0 ? (
              <Spinner />
            ) : (
              <Box
                as={MagnifyingGlassIcon}
                css={{
                  width: "$5",
                  height: "$5",
                  color: "$neutral9",
                }}
              />
            )}
          </Box>

          <TextField
            disabled={accounts.length <= 0}
            placeholder="Search orchestrators & delegators"
            type="search"
            css={{
              borderRadius: "$2",
              height: "$8",
              fontSize: "$5",
              pr: "$3",
              pl: "$7",
              "&:-webkit-autofill::first-line": {
                fontSize: "$3",
              },
            }}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Box
          css={{
            maxHeight: searchMapping.length > 0 ? 400 : 30,
            transition: "max-height 0.2s",
            overflow: "scroll",
            mt: "$1",
          }}
        >
          {search.length > 1 && searchMapping.length <= 0 ? (
            <Flex css={{ mt: "$1" }}>
              <Text>No results found.</Text>
            </Flex>
          ) : (
            searchMapping
              .filter((e) => e.item.id)
              .map((result) => (
                <A key={result.item.id} href={`/accounts/${result.item.id}`}>
                  <Flex
                    css={{
                      cursor: "pointer",
                      borderRadius: "$2",
                      fontSize: "$5",
                      py: "$2",
                      px: "$3",
                      my: "$1",
                      bc: "$neutral3",
                      justifyContent: "space-between",
                      alignItems: "center",
                      "&:-webkit-autofill::first-line": {
                        fontSize: "$3",
                      },
                      "&:hover": {
                        bc: "$neutral4",
                      },
                    }}
                  >
                    <Flex>
                      <Text>
                        {result.item.name
                          ? `${result.item.name} (${result.item.id.replace(
                              result.item.id.slice(5, 39),
                              "…"
                            )})`
                          : result.item.id.replace(
                              result.item.id.slice(7, 37),
                              "…"
                            )}
                      </Text>
                    </Flex>
                    <Box as={ArrowRightIcon} />
                  </Flex>
                </A>
              ))
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
export default Index;
