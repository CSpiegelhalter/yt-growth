"use client";

import { OptionListSection } from "./OptionListSection";

type HooksSectionProps = {
  hooks: string[];
  copiedId: string | null;
  isLoading: boolean;
  hasError: boolean;
  showAll: boolean;
  onShowAllToggle: () => void;
  onCopy: (text: string, id: string) => void;
  onRetry: () => void;
};

export function HooksSection({
  hooks,
  copiedId,
  isLoading,
  hasError,
  showAll,
  onShowAllToggle,
  onCopy,
  onRetry,
}: HooksSectionProps) {
  return (
    <OptionListSection
      title="Hooks"
      intro="Use one as your first line and commit to it in the first 10 seconds."
      items={hooks}
      keyPrefix="hook"
      copyAllId="all-hooks"
      errorLabel="Couldn't generate hooks."
      quoteItems
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
