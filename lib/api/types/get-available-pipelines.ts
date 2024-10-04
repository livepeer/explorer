export type Pipeline = {
  id: string;
  models: string[];
  regions: string[];
};

export type AvailablePipelines = {
  pipelines: Pipeline[];
};