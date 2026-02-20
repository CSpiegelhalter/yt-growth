"use client";

import { OptionListSection } from "./OptionListSection";

type TitleOptionsSectionProps = {
  titles: string[];
  copiedId: string | null;
  isLoading: boolean;
  hasError: boolean;
  showAll: boolean;
  onShowAllToggle: () => void;
  onCopy: (text: string, id: string) => void;
  onRetry: () => void;
};

export function TitleOptionsSection({
  titles,
  copiedId,
  isLoading,
  hasError,
  showAll,
  onShowAllToggle,
  onCopy,
  onRetry,
}: TitleOptionsSectionProps) {
  return (
    <OptionListSection
      title="Title options"
      intro="Choose one that matches your tone, then film the description above."
      items={titles}
      keyPrefix="title"
      copyAllId="all-titles"
      errorLabel="Couldn't generate title options."
      copiedId={copiedId}
      isLoading={isLoading}
      hasError={hasError}
      showAll={showAll}
      onShowAllToggle={onShowAllToggle}
      onCopy={onCopy}
      onRetry={onRetry}
    />
  );
}
