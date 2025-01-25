interface SmallHitPreviewProps {
  point: number[];
  bullseye?: number[];
  score: number;
}

export const SmallHitPreview = (props: SmallHitPreviewProps) => {
  const { point, bullseye, score } = props;

  // Canvas size
  const canvasSize = 50;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  // Calculate the angle between the bullseye and the hit point relative to the bullseye
  const dx = point[0] - (bullseye?.[0] || 0);
  const dy = point[1] - (bullseye?.[1] || 0);
  const angle = Math.atan2(dy, dx); // Angle in radians

  // Calculate the distance from the bullseye based on score (10 = closest, 5 = furthest)
  const maxDistance = canvasSize / 2; // Maximum distance from the center (radius)
  const distance = ((10 - score) / 5) * maxDistance; // Scale based on score (score 10 = closest, score 5 = furthest)

  // Calculate the new hit point's position using angle and distance
  const hitX = centerX + distance * Math.cos(angle);
  const hitY = centerY + distance * Math.sin(angle);

  const ringColors = ["#6495ED", "#B22222", "#FFD700"];

  return (
    <svg width={canvasSize} height={canvasSize} className="border">
      {/* Concentric circles */}
      {ringColors.map((color, i) => {
        const radius = (canvasSize / 2) * ((ringColors.length - i) / 3); // Divide evenly into 3 rings
        return (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={radius}
            stroke="black"
            fill={color}
            strokeWidth="0.5"
          />
        );
      })}

      {/* Cross lines */}
      <line
        x1={centerX}
        y1={0}
        x2={centerX}
        y2={canvasSize}
        stroke="black"
        strokeDasharray="3,2"
        strokeWidth="1"
      />
      <line
        x1={0}
        y1={centerY}
        x2={canvasSize}
        y2={centerY}
        stroke="black"
        strokeDasharray="3,2"
        strokeWidth="1"
      />

      {/* Bullseye */}
      <circle cx={centerX} cy={centerY} r={2} fill={ringColors[ringColors.length - 1]} />

      {/* Hit point */}
      <circle
        cx={hitX}
        cy={hitY}
        r={4}
        fill="lime"
        strokeWidth={1}
        stroke="black"
      />
    </svg>
  );
};
