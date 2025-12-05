import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
} from "@livepeer/design-system";
import { MagnifyingGlassIcon } from "@modulz/radix-icons";
import { useMemo, useState } from "react";

import {
  Application,
  ApplicationCategory,
  APPLICATIONS,
} from "../data/applications";
import { MEDIA_APIS } from "../data/mediaApis";

type View = "applications" | "media_apis";
type MediaCategory =
  | "all"
  | "realtime"
  | "async"
  | "transcription"
  | "summarization"
  | "video"
  | "audio";

const applicationCategories: {
  value: ApplicationCategory | "all";
  label: string;
  sub?: string[];
}[] = [
  { value: "all", label: "All" },
  {
    value: "ai_video",
    label: "AI / Video",
    sub: ["Realtime", "Async", "Transcription"],
  },
  {
    value: "live_streaming",
    label: "Live streaming",
    sub: ["Realtime", "Async"],
  },
  { value: "creator_tools", label: "Creator tools" },
  { value: "marketplaces", label: "Marketplaces" },
  { value: "developer_tools", label: "Developer tools" },
  { value: "infra", label: "Infra" },
];

const mediaApiCategories: { value: MediaCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "realtime", label: "Realtime" },
  { value: "async", label: "Async" },
  { value: "transcription", label: "Transcription" },
  { value: "summarization", label: "Summarization" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
];

const ViewSelector = ({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) => (
  <Flex css={{ gap: "$2" }}>
    {[
      { value: "applications" as View, label: "Applications" },
      { value: "media_apis" as View, label: "Media APIs" },
    ].map((item) => {
      const active = view === item.value;
      return (
        <Button
          key={item.value}
          size="3"
          onClick={() => onChange(item.value)}
          css={{
            borderRadius: 8,
            paddingLeft: "$4",
            paddingRight: "$4",
            paddingTop: "$2",
            paddingBottom: "$2",
            fontWeight: 600,
            border: "1px solid",
            borderColor: active ? "rgba(16,185,129,0.6)" : "$neutral6",
            backgroundColor: active ? "rgba(16,185,129,0.2)" : "$neutral3",
            color: active ? "$hiContrast" : "$neutral11",
          }}
        >
          {item.label}
        </Button>
      );
    })}
  </Flex>
);

const CategoryFilters = ({
  active,
  onChange,
  categories,
}: {
  active: string;
  onChange: (v: string) => void;
  categories: { value: string; label: string }[];
}) => (
  <Flex css={{ gap: "$2", flexWrap: "wrap" }}>
    {categories.map((cat) => {
      const activeState = active === cat.value;
      return (
        <Button
          key={cat.value}
          size="2"
          onClick={() => onChange(cat.value)}
          css={{
            borderRadius: "$pill",
            paddingLeft: "$3",
            paddingRight: "$3",
            paddingTop: "$1",
            paddingBottom: "$1",
            fontSize: "$1",
            fontWeight: 600,
            border: "1px solid",
            borderColor: activeState ? "rgba(16,185,129,0.8)" : "$neutral6",
            backgroundColor: activeState ? "rgba(16,185,129,0.2)" : "$neutral3",
            color: activeState ? "$hiContrast" : "$neutral11",
            "&:hover": {
              borderColor: activeState ? "rgba(16,185,129,0.8)" : "$neutral7",
              backgroundColor: activeState
                ? "rgba(16,185,129,0.25)"
                : "$neutral4",
            },
          }}
        >
          {cat.label}
        </Button>
      );
    })}
  </Flex>
);

const SearchInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => (
  <Box
    css={{
      position: "relative",
      width: "100%",
      "@bp2": { maxWidth: 320 },
    }}
  >
    <Box
      as={MagnifyingGlassIcon}
      aria-hidden
      css={{
        position: "absolute",
        left: "$3",
        top: "50%",
        transform: "translateY(-50%)",
        color: "$neutral9",
      }}
    />
    <Box
      as="input"
      value={value}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      placeholder="Search apps and APIs"
      css={{
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.4)",
        border: "1px solid $neutral7",
        borderRadius: 9999,
        padding: "$2",
        paddingLeft: "$6",
        paddingRight: "$3",
        color: "$hiContrast",
        fontSize: "$2",
        outline: "none",
        "&::placeholder": { color: "$neutral9" },
        "&:focus": { borderColor: "rgba(16,185,129,0.6)" },
      }}
    />
  </Box>
);

const ApplicationCard = ({ app }: { app: Application }) => (
  <Box
    as="a"
    href={app.url}
    target="_blank"
    rel="noreferrer noopener"
    css={{
      border: "1px solid $neutral6",
      borderRadius: "$5",
      padding: "$5",
      backgroundColor: "rgba(6,8,10,0.7)",
      display: "flex",
      flexDirection: "column",
      gap: "$3",
      height: "100%",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s",
      textDecoration: "none",
      "&:hover": {
        transform: "translateY(-2px)",
        borderColor: "rgba(16,185,129,0.6)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
      },
    }}
  >
    <Box
      css={{
        width: 52,
        height: 52,
        borderRadius: "$3",
        backgroundColor: "$neutral4",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {app.logoUrl ? (
        <Box
          as="img"
          src={app.logoUrl}
          alt={app.name}
          css={{ width: 40, height: 40, objectFit: "contain" }}
        />
      ) : (
        <Text css={{ fontWeight: 700, color: "$hiContrast" }}>
          {app.name.slice(0, 2).toUpperCase()}
        </Text>
      )}
    </Box>
    <Box>
      <Heading size="4" css={{ marginBottom: "$1", color: "$hiContrast" }}>
        {app.name}
      </Heading>
      <Text css={{ fontSize: "$2", color: "$neutral9", marginBottom: "$2" }}>
        {app.domain}
      </Text>
      <Text
        variant="neutral"
        css={{
          color: "$neutral11",
          lineHeight: "1.6",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {app.description}
      </Text>
    </Box>
    <Flex css={{ gap: "$2", flexWrap: "wrap", marginTop: "auto" }}>
      {app.tags.slice(0, 3).map((tag) => (
        <Box
          key={tag}
          css={{
            fontSize: "11px",
            color: "$neutral10",
            backgroundColor: "$neutral3",
            border: "1px solid $neutral6",
            padding: "4px 8px",
            borderRadius: "$pill",
          }}
        >
          {tag}
        </Box>
      ))}
      {app.tags.length > 3 && (
        <Box
          css={{
            fontSize: "11px",
            color: "$neutral10",
            backgroundColor: "$neutral3",
            border: "1px solid $neutral6",
            padding: "4px 8px",
            borderRadius: "$pill",
          }}
        >
          +{app.tags.length - 3}
        </Box>
      )}
    </Flex>
  </Box>
);

const MediaApiCard = ({ api }: { api: (typeof MEDIA_APIS)[number] }) => (
  <Box
    as="a"
    href={api.docsUrl}
    target="_blank"
    rel="noreferrer noopener"
    css={{
      border: "1px solid $neutral6",
      borderRadius: "$5",
      padding: "$5",
      backgroundColor: "rgba(6,8,10,0.7)",
      display: "flex",
      flexDirection: "column",
      gap: "$3",
      height: "100%",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s",
      textDecoration: "none",
      "&:hover": {
        transform: "translateY(-2px)",
        borderColor: "rgba(16,185,129,0.6)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
      },
    }}
  >
    <Box
      css={{
        width: 52,
        height: 52,
        borderRadius: "$3",
        backgroundColor: "$neutral4",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {api.logoUrl ? (
        <Box
          as="img"
          src={api.logoUrl}
          alt={api.name}
          css={{ width: 40, height: 40, objectFit: "contain" }}
        />
      ) : (
        <Text css={{ fontWeight: 700, color: "$hiContrast" }}>
          {api.name.slice(0, 2).toUpperCase()}
        </Text>
      )}
    </Box>
    <Box>
      <Heading size="4" css={{ marginBottom: "$1", color: "$hiContrast" }}>
        {api.name}
      </Heading>
      <Text variant="neutral" css={{ color: "$neutral10", marginBottom: "$2" }}>
        {api.description}
      </Text>
      {api.apiEndpointExample && (
        <Box
          css={{
            display: "inline-flex",
            alignItems: "center",
            marginTop: "$1",
            padding: "6px 10px",
            borderRadius: "$pill",
            border: "1px solid rgba(16,185,129,0.4)",
            color: "$hiContrast",
            backgroundColor: "rgba(16,185,129,0.12)",
            fontSize: "$2",
            fontWeight: 600,
          }}
        >
          {api.apiEndpointExample}
        </Box>
      )}
    </Box>
    <Flex css={{ gap: "$2", flexWrap: "wrap", marginTop: "auto" }}>
      {api.tags.slice(0, 3).map((tag) => (
        <Box
          key={tag}
          css={{
            fontSize: "11px",
            color: "$neutral10",
            backgroundColor: "$neutral3",
            border: "1px solid $neutral6",
            padding: "4px 8px",
            borderRadius: "$pill",
          }}
        >
          {tag}
        </Box>
      ))}
      {api.tags.length > 3 && (
        <Box
          css={{
            fontSize: "11px",
            color: "$neutral10",
            backgroundColor: "$neutral3",
            border: "1px solid $neutral6",
            padding: "4px 8px",
            borderRadius: "$pill",
          }}
        >
          +{api.tags.length - 3}
        </Box>
      )}
    </Flex>
  </Box>
);

const EcosystemPage = () => {
  const [view, setView] = useState<View>("applications");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  const filteredApplications = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APPLICATIONS.filter((app) => {
      const matchesCategory =
        activeCategory === "all" ||
        app.categories.includes(activeCategory as ApplicationCategory);
      const matchesQuery =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.domain.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const filteredApis = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDIA_APIS.filter((api) => {
      const matchesCategory =
        activeCategory === "all" ||
        api.categories.some((cat) =>
          cat.toLowerCase().includes(activeCategory.toLowerCase())
        );
      const matchesQuery =
        !q ||
        api.name.toLowerCase().includes(q) ||
        api.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const showApplications = view === "applications";
  const currentCategories = showApplications
    ? applicationCategories
    : mediaApiCategories;

  return (
    <Box css={{ backgroundColor: "$loContrast", minHeight: "100vh" }}>
      <Container
        size="4"
        css={{
          maxWidth: LAYOUT_MAX_WIDTH,
          paddingTop: "$3",
          paddingBottom: "$6",
        }}
      >
        <Flex css={{ flexDirection: "column", gap: "$4" }}>
          <Flex
            css={{
              justifyContent: "space-between",
              alignItems: "center",
              gap: "$3",
              flexDirection: "column",
              "@bp2": { flexDirection: "row" },
            }}
          >
            <Box>
              <Heading
                size="4"
                css={{ marginBottom: "$1", color: "$hiContrast" }}
              >
                Ecosystem
              </Heading>
              <Text variant="neutral" css={{ color: "$neutral10" }}>
                Explore applications built on Livepeer and discover the building
                blocks to create your own.
              </Text>
            </Box>
            <Button
              as="a"
              href="https://docs.livepeer.org"
              variant="transparentBlack"
              size="3"
              css={{ whiteSpace: "nowrap" }}
            >
              Build with Livepeer →
            </Button>
          </Flex>

          <Flex
            css={{
              flexDirection: "column",
              gap: "$3",
              "@bp2": {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            }}
          >
            <ViewSelector
              view={view}
              onChange={(v) => {
                setView(v);
                setActiveCategory("all");
              }}
            />
            <Flex
              css={{
                gap: "$2",
                alignItems: "center",
                flexWrap: "wrap",
                flex: 1,
                justifyContent: "space-between",
              }}
            >
              <CategoryFilters
                active={activeCategory}
                onChange={(value) => setActiveCategory(value)}
                categories={currentCategories}
              />
              <Box
                css={{
                  width: "100%",
                  "@bp2": {
                    width: "auto",
                  },
                }}
              >
                <SearchInput value={query} onChange={setQuery} />
              </Box>
            </Flex>
          </Flex>

          {showApplications ? (
            <Box
              css={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "$4",
              }}
            >
              {filteredApplications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </Box>
          ) : (
            <Box
              css={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "$4",
              }}
            >
              {filteredApis.length === 0 ? (
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
                    No Media APIs match your search.
                  </Text>
                </Box>
              ) : (
                filteredApis.map((api) => (
                  <MediaApiCard key={api.id} api={api} />
                ))
              )}
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

EcosystemPage.getLayout = getLayout;

export default EcosystemPage;
