export type ThumbnailStyleV2 = "compare" | "subject" | "object" | "hold";

export type StyleModelConfig = {
  style: ThumbnailStyleV2;
  model: string; // "owner/name"
  version: string;
  triggerWord: string;
};

export const STYLE_MODELS: Record<ThumbnailStyleV2, StyleModelConfig> = {
  object: {
    style: "object",
    model: "cspiegelhalter/object",
    version:
      "611a12ed1535dd8f4bb473e7240c2d43f51d030a641aa80a5dac98fbb331f7fb",
    triggerWord: "OBJECT",
  },
  hold: {
    style: "hold",
    model: "cspiegelhalter/holding_object",
    version:
      "1136812fb4dd788d67c2124b4c73653c974085d47bd689712d2fc1f796facf7e",
    triggerWord: "HOLD",
  },
  subject: {
    style: "subject",
    model: "cspiegelhalter/subject",
    version:
      "7d64eba402fc84ae71ee8360db3a574a7b287f6a3b4817b3b22834cfabb9ba1d",
    triggerWord: "SUBJECT",
  },
  compare: {
    style: "compare",
    model: "cspiegelhalter/compare",
    version:
      "2d0b60b1968b1a4950f03475adaf3e497f6f68b3d44db97721be0973ebf380a0",
    triggerWord: "COMPARE",
  },
};

