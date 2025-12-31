/**
 * Video Insights Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 * 
 * Uses inline styles since video page has complex styling handled by the client component.
 */
export default function VideoInsightsLoading() {
  return (
    <div style={{ 
      maxWidth: "var(--page-max-width)", 
      margin: "0 auto", 
      padding: "var(--page-padding-mobile)" 
    }}>
      {/* Back link skeleton */}
      <div className="skeleton" style={{ height: 20, width: 100, marginBottom: 24 }} />
      
      {/* Header skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div className="skeleton" style={{ height: 28, width: "70%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 18, width: "40%" }} />
      </div>

      {/* Stats row skeleton */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", 
        gap: 16, 
        marginBottom: 32 
      }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i} 
            style={{ 
              background: "var(--surface)", 
              border: "1px solid var(--border)", 
              borderRadius: "var(--radius-md)", 
              padding: 16,
              textAlign: "center" 
            }}
          >
            <div className="skeleton" style={{ height: 28, width: "60%", margin: "0 auto 8px" }} />
            <div className="skeleton" style={{ height: 14, width: "80%", margin: "0 auto" }} />
          </div>
        ))}
      </div>

      {/* Chart placeholder skeleton */}
      <div style={{ 
        background: "var(--surface)", 
        border: "1px solid var(--border)", 
        borderRadius: "var(--radius-lg)", 
        padding: 24,
        marginBottom: 32
      }}>
        <div className="skeleton" style={{ height: 22, width: 180, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 200, width: "100%", borderRadius: "var(--radius-md)" }} />
      </div>

      {/* Content sections skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {Array.from({ length: 2 }).map((_, i) => (
          <div 
            key={i}
            style={{ 
              background: "var(--surface)", 
              border: "1px solid var(--border)", 
              borderRadius: "var(--radius-lg)", 
              padding: 24
            }}
          >
            <div className="skeleton" style={{ height: 22, width: 200, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 16, width: "90%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: "75%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: "60%" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
