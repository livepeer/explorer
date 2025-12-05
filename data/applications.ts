export type ApplicationCategory =
  | "ai_video"
  | "live_streaming"
  | "creator_tools"
  | "marketplaces"
  | "developer_tools"
  | "infra";

export type ApplicationTag =
  | "CONSUMER"
  | "DEVELOPER TOOL"
  | "INFRA"
  | "SOCIAL"
  | "EXPERIMENTAL";

export type ApplicationStatus = "live" | "beta" | "coming_soon";

export type Application = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  url: string;
  domain: string;
  description: string;
  shortDescription?: string;
  categories: ApplicationCategory[];
  tags: ApplicationTag[];
  status: ApplicationStatus;
  docsUrl?: string;
  githubUrl?: string;
  featured?: boolean;
};

export const APPLICATIONS: Application[] = [
  {
    id: "soldar-io",
    name: "Soldar.io",
    slug: "soldar-io",
    logoUrl: "/img/cube.png",
    url: "https://soldar.io",
    domain: "soldar.io",
    description:
      "On-demand transcoding and streaming toolkit built on Livepeer primitives.",
    categories: ["live_streaming", "developer_tools"],
    tags: ["CONSUMER", "DEVELOPER TOOL"],
    status: "live",
  },
  {
    id: "livepeer-studio",
    name: "Livepeer Studio",
    slug: "livepeer-studio",
    logoUrl: "https://20572069.fs1.hubspotusercontent-eu1.net/hubfs/20572069/SPN%20Logos/livepeer_logo.png",
    url: "https://livepeer.studio",
    domain: "livepeer.studio",
    description:
      "Ingest, transcoding, playback, and analytics with Livepeer under the hood.",
    categories: ["developer_tools", "infra"],
    tags: ["DEVELOPER TOOL", "INFRA"],
    status: "live",
  },
  {
    id: "streameth",
    name: "StreamETH",
  slug: "streameth",
  logoUrl: "https://pbs.twimg.com/profile_images/1699810319818719233/B_VqXGfq_400x400.jpg",
  url: "https://streameth.tv",
  domain: "streameth.tv",
  description:
      "IRL + virtual event streaming with Livepeer-backed transcoding and playback.",
    categories: ["live_streaming"],
    tags: ["CONSUMER"],
    status: "live",
  },
];
