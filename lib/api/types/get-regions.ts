export type Regions = {
  regions: Region[];
};

export type Region = {
  id: string;
  name: string;
  type: "transcoding" | "ai";
};
