import { redirect, notFound } from "next/navigation";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription } from "@/lib/server/auth";
import { getFeatureFlag } from "@/lib/shared/feature-flags";
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
  // Check feature flag first (returns 404 if disabled)
  const isEnabled = await getFeatureFlag("thumbnail_generation");
  if (!isEnabled) {
    notFound();
  }

  const user = await getCurrentUserWithSubscription();
  if (!user) {
    redirect("/auth/login?redirect=/thumbnails");
  }

  const { projectId } = await params;
  const project = await prisma.thumbnailProject.findUnique({
    where: { id: projectId },
  });

  if (!project || project.userId !== user.id) {
    redirect("/thumbnails");
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

