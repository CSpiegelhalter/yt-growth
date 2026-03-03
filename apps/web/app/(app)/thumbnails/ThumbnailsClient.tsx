"use client";

/**
 * ThumbnailsClient (Orchestrator)
 *
 * Thin orchestrator that composes the thumbnail workflow UI.
 * All state management lives in useThumbnailWorkflow; all
 * rendering is delegated to leaf components.
 */

import { ErrorBanner, PageContainer, PageHeader } from "@/components/ui";

import { DescriptionInput } from "./_components/DescriptionInput";
import { GenerateButtonBody } from "./_components/GenerateButtonBody";
import { GenerationResults } from "./_components/GenerationResults";
import { PhotoUploader } from "./_components/PhotoUploader";
import { StyleSelector } from "./_components/StyleSelector";
import { useThumbnailWorkflow } from "./_components/useThumbnailWorkflow";
import s from "./style.module.css";
import type { ThumbnailsClientProps } from "./thumbnail-types";

export function ThumbnailsClient({ initialUser }: ThumbnailsClientProps) {
  void initialUser;
  const wf = useThumbnailWorkflow();

  return (
    <PageContainer>
      <PageHeader
        title="Thumbnail Studio"
        subtitle="Generate premium, style-consistent thumbnails (no AI text baked in). Add your text, arrows, shapes, and overlays in the editor."
      />

      {wf.error && <ErrorBanner message={wf.error} />}

      <div className={s.formCard}>
        <div className={s.formGrid}>
          <StyleSelector
            style={wf.style}
            onStyleChange={wf.setStyle}
            disabled={wf.generating}
          />

          <DescriptionInput
            prompt={wf.prompt}
            onPromptChange={wf.setPrompt}
            examples={wf.examples}
            disabled={wf.generating}
          />

          <PhotoUploader
            photos={wf.photos}
            photoCount={wf.photoCount}
            identityReady={wf.identityReady}
            identity={wf.identity}
            uploading={wf.uploading}
            generating={wf.generating}
            resettingModel={wf.resettingModel}
            deletingPhotoId={wf.deletingPhotoId}
            includeIdentity={wf.includeIdentity}
            canUseIdentity={wf.canUseIdentity}
            isCompatibleStyle={wf.isCompatibleStyle}
            hasEnoughPhotos={wf.hasEnoughPhotos}
            onUploadPhotos={(e) => void wf.handleUploadPhotos(e)}
            onDeletePhoto={(id) => void wf.handleDeletePhoto(id)}
            onResetModel={(dp) => void wf.handleResetModel(dp)}
            onToggleIdentity={() => wf.setIncludeIdentity((v) => !v)}
          />
        </div>

        <button
          className={`${s.generateBtn} ${s.desktopOnlyGenerateBtn}`}
          onClick={wf.handleGenerate}
          disabled={wf.isGenerateDisabled}
        >
          <GenerateButtonBody
            generating={wf.generating}
            generationPhase={wf.generationPhase}
            includeIdentity={wf.includeIdentity}
            identityReady={wf.identityReady}
          />
        </button>
      </div>

      <div className={s.mobileGenerateWrapper}>
        <button
          className={s.mobileGenerateBtn}
          onClick={wf.handleGenerate}
          disabled={wf.isGenerateDisabled}
        >
          <GenerateButtonBody
            generating={wf.generating}
            generationPhase={wf.generationPhase}
            includeIdentity={wf.includeIdentity}
            identityReady={wf.identityReady}
            compact
          />
        </button>
      </div>

      <GenerationResults
        job={wf.job}
        generating={wf.generating}
        regenerating={wf.regenerating}
        onOpenEditor={(url) => wf.openEditor(url)}
        onRegenerate={(url, parentJobId) =>
          wf.handleRegenerate(url, parentJobId)
        }
        toastFn={wf.toast}
      />
    </PageContainer>
  );
}
