import { LAYOUT_MAX_WIDTH } from "@layouts/main";
import { Box, Container, Flex, Text } from "@livepeer/design-system";

import { EcosystemItem } from "../../data/ecosystem";
import CategorySelector from "./CategorySelector";
import MarketplaceCard from "./MarketplaceCard";
import SearchInput from "./SearchInput";

type Props = {
  title: string;
  type: "applications" | "mediaApis";
  listings: EcosystemItem[];
  categories: string[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

const MarketplaceLayout = ({
  title,
  listings,
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
}: Props) => {
  return (
    <Box css={{ backgroundColor: "$loContrast", minHeight: "100vh" }}>
      <Container
        size="4"
        css={{
          maxWidth: LAYOUT_MAX_WIDTH,
          paddingTop: "$3",
          paddingBottom: "$4",
        }}
      >
        <Flex
          css={{
            gap: "$3",
            flexDirection: "column",
          }}
        >
          <Box css={{ marginTop: "$1", color: "$neutral11" }}>
            <Text css={{ fontSize: "$2", color: "$neutral10" }}>
              Marketplace › {title}
            </Text>
          </Box>

          <Flex
            css={{
              marginTop: "$3",
              marginBottom: "$5",
              gap: "$3",
              flexDirection: "column",
              "@bp2": {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            }}
          >
            <CategorySelector
              categories={categories}
              activeCategory={activeCategory}
              onChange={onCategoryChange}
            />
            <SearchInput value={search} onChange={onSearchChange} />
          </Flex>

          {listings.length === 0 ? (
            <Box
              css={{
                padding: "$5",
                borderRadius: "$4",
                border: "1px solid $neutral4",
                backgroundColor: "$panel",
              }}
            >
              <Text
                variant="neutral"
                css={{ color: "$neutral10", textAlign: "center" }}
              >
                No listings match your search. Try a different filter.
              </Text>
            </Box>
          ) : (
            <Box
              css={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "$4",
              }}
            >
              {listings.map((item) => (
                <MarketplaceCard key={item.id} item={item} />
              ))}
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default MarketplaceLayout;
