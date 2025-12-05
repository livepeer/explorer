import MarketplaceLayout from "@components/marketplace/MarketplaceLayout";
import { getLayout } from "@layouts/main";
import { useMemo, useState } from "react";

import { ECOSYSTEM_ITEMS, EcosystemItem } from "../../data/ecosystem";

const categories = [
  "All",
  "Transcription",
  "Summarization",
  "Audio",
  "Video",
  "Realtime",
  "Async",
];

const MediaApisPage = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  const filteredListings: EcosystemItem[] = useMemo(() => {
    const normalizedQuery = search.toLowerCase();

    return ECOSYSTEM_ITEMS.filter((listing) => {
      if (listing.type !== "media_api") return false;

      const categoryMatch =
        activeCategory === "All" ||
        listing.categories.some((cat) =>
          cat.toLowerCase().includes(activeCategory.toLowerCase())
        );

      const searchMatch =
        !normalizedQuery ||
        listing.name.toLowerCase().includes(normalizedQuery) ||
        listing.description.toLowerCase().includes(normalizedQuery) ||
        listing.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return categoryMatch && searchMatch;
    });
  }, [activeCategory, search]);

  return (
    <MarketplaceLayout
      title="Media APIs"
      type="mediaApis"
      listings={filteredListings}
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      search={search}
      onSearchChange={setSearch}
    />
  );
};

MediaApisPage.getLayout = getLayout;

export default MediaApisPage;
