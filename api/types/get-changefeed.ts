export type Change = {
  type: string;
  content: string;
};

export type Node = {
  title: string;
  description: string;
  isPublished: boolean;
  publishedAt: Date;
  changes: Change[];
};

export type Edge = {
  node: Node;
};

export type Releases = {
  edges: Edge[];
};

export type GetChangefeed = {
  name: string;
  releases: Releases;
};
