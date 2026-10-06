export type CurrentRoundInfo = {
  id: number;
  startBlock: number;
  initialized: boolean;
  locked: boolean;
  roundLength: number;
  currentL1Block: number;
  currentL2Block: number;
};
