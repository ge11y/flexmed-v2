export function AnnouncementBar() {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        color: "var(--text-muted)",
        fontSize: "12px",
        textAlign: "center",
        padding: "8px 16px",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ color: "var(--amber)" }}>Research use only.</span> For verified institutional buyers.
    </div>
  );
}
