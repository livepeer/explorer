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
  projectOwner: string;
  projectName: string;
  gitCommitHash: string;
  lips: PollLip[];
};
