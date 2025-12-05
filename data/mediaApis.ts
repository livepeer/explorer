export type MediaApiStatus = "live" | "beta" | "coming_soon";

export type MediaApi = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  docsUrl: string;
  playgroundUrl?: string;
  apiEndpointExample?: string;
  description: string;
  categories: string[];
  tags: string[];
  status: MediaApiStatus;
  featured?: boolean;
};

export const MEDIA_APIS: MediaApi[] = [
  {
    id: "llm",
    name: "LLM Media Summarization",
    slug: "llm-media-summarization",
    logoUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=256&q=80",
    docsUrl: "/api/solutions/llm",
    playgroundUrl: "/console/solutions/llm",
    apiEndpointExample: "POST /api/solutions/llm",
    description:
      "Batch summarization, prompting, and task orchestration for augmenting real-time outputs.",
    categories: ["summarization", "async"],
    tags: ["AI", "ASYNC", "CLOUD"],
    status: "beta",
  },
  {
    id: "live-transcription",
    name: "Live Transcription",
    slug: "live-transcription",
    logoUrl: "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?w=256&q=80",
    docsUrl: "/api/solutions/transcription",
    playgroundUrl: "/console/solutions/transcription",
    apiEndpointExample: "POST /api/solutions/transcription",
    description:
      "Low-latency speech-to-text with diarization and language detection for live streams.",
    categories: ["realtime", "transcription"],
    tags: ["AI", "REALTIME", "CLOUD"],
    status: "live",
  },
  {
    id: "audio-enhancement",
    name: "Audio Enhancement",
    slug: "audio-enhancement",
    logoUrl: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=256&q=80",
    docsUrl: "/api/solutions/audio-enhancement",
    playgroundUrl: "/console/solutions/audio-enhancement",
    apiEndpointExample: "POST /api/solutions/audio-enhancement",
    description:
      "Noise suppression and gain control for real-time streams and VOD audio.",
    categories: ["audio", "realtime"],
    tags: ["AI", "REALTIME", "CLOUD"],
    status: "beta",
  },
];
