"use client";

/**
 * IdentityStatusLine
 *
 * Displays the current identity model status:
 * photo count, readiness, training progress, or errors.
 */

import s from "../style.module.css";

type IdentityStatusLineProps = {
  photoCount: number;
  identityReady: boolean;
  identityStatus: string;
  errorMessage?: string;
};

export function IdentityStatusLine({
  photoCount,
  identityReady,
  identityStatus,
  errorMessage,
}: IdentityStatusLineProps) {
  return (
    <div className={s.identityStatus}>
      <span>
        {photoCount} photo{photoCount !== 1 ? "s" : ""} uploaded
      </span>
      {photoCount < 7 && !identityReady && (
        <span className={s.identityHint}>
          {" "}
          — need {7 - photoCount} more to enable
        </span>
      )}
      {identityReady && (
        <span className={s.identityReady}> ✓ Ready to use</span>
      )}
      {identityStatus === "training" && (
        <span className={s.identityTraining}>
          {" "}
          — Training in progress…
        </span>
      )}
      {identityStatus !== "none" && errorMessage && (
        <span className={s.identityError}>
          {" "}
          — {errorMessage}
        </span>
      )}
    </div>
  );
}
