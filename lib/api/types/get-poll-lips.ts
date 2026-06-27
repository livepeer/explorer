export type PollLip = {
  attributes: {
    lip: string;
    title: string;
    status: string;
    created: string;
    "part-of"?: string;
  };
  text: string;
};

export type PollLips = {
  projectOwner: string | null;
  projectName: string | null;
  gitCommitHash: string | null;
  lips: PollLip[];
};
