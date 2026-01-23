import { PageContainer, PageHeader, Skeleton } from "@/components/ui";

export default function GoalsLoading() {
  return (
    <PageContainer>
      <PageHeader
        title="Goals & Achievements"
        subtitle="Track habits that grow your channel."
      />

      {/* Summary cards skeleton */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: "1 1 200px",
              minWidth: "160px",
              maxWidth: "280px",
            }}
          >
            <Skeleton height="100px" />
          </div>
        ))}
      </div>

      {/* Goals section skeleton */}
      <div style={{ marginBottom: "32px" }}>
        <Skeleton height="24px" width="150px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height="80px" />
          ))}
        </div>
      </div>

      {/* Achievements section skeleton */}
      <div>
        <Skeleton height="24px" width="150px" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginTop: "16px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height="100px" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
