export type NormalizedImage = {
  bytes: Buffer;
  width: number;
  height: number;
  contentType: "image/jpeg";
};

export type DatasetChangeAction =
  | "none"
  | "invalidated"
  | "coalesced"
  | "training_started";

export type DatasetChangeResult = {
  action: DatasetChangeAction;
  newHash: string;
};

export type TrainingCompleteAction = "completed" | "retraining";

export type TrainingCompleteResult = {
  action: TrainingCompleteAction;
  needsRetrain: boolean;
};

export type InvalidationCheck = {
  needsInvalidation: boolean;
  currentHash: string;
  model: {
    id: string;
    status: string;
    datasetHash: string | null;
    needsRetrain: boolean;
    replicateModelOwner: string;
    replicateModelName: string;
  } | null;
};

export type TrainabilityCheck = {
  canTrain: boolean;
  photoCount: number;
  minRequired: number;
};
