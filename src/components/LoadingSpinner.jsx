function LoadingSpinner({ size = "md", text = "Caricamento..." }) {
  const sizeMap = { sm: 24, md: 40, lg: 56 };
  const borderMap = { sm: 2, md: 3, lg: 4 };
  const px = sizeMap[size] ?? 40;
  const bw = borderMap[size] ?? 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      <div style={{
        width: px, height: px,
        border: `${bw}px solid rgba(124,58,237,0.2)`,
        borderTopColor: "#7c3aed",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      {text && (
        <p style={{ marginTop: "12px", fontSize: "13px", fontWeight: 500, color: "var(--nx-text-muted)" }}>
          {text}
        </p>
      )}
    </div>
  );
}

export default LoadingSpinner;