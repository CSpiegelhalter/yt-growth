import { notFound } from "next/navigation";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { getFeatureFlag } from "@/lib/shared/feature-flags";
import { prisma } from "@/prisma";

import ThumbnailEditorClient from "./ThumbnailEditorClient";

export const metadata = {
  title: "Thumbnail Editor | ChannelBoost",
  robots: { index: false, follow: false },
};

export default async function ThumbnailEditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const isEnabled = await getFeatureFlag("thumbnail_generation");
  if (!isEnabled) {
    notFound();
  }

  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap} requireChannel={false}>
      {(data) => (
        <ThumbnailEditorContent
          params={params}
          userId={data.me.id}
        />
      )}
    </AccessGate>
  );
}

async function ThumbnailEditorContent({
  params,
  userId,
}: {
  params: Promise<{ projectId: string }>;
  userId: number;
}) {
  const { projectId } = await params;
  const project = await prisma.thumbnailProject.findUnique({
    where: { id: projectId },
  });

  if (!project || project.userId !== userId) {
    notFound();
  }

  return (
    <ThumbnailEditorClient
      projectId={project.id}
      baseImageUrl={project.baseImageUrl}
      initialEditorState={project.editorState}
      initialExports={project.exports}
    />
  );
}
