import React from 'react';
import Svg, { Defs, LinearGradient, Polygon, Polyline, Stop } from 'react-native-svg';

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  positive: boolean;
}

export default function Sparkline({ data, width, height, positive }: SparklineProps) {
  const color = positive ? '#4DED30' : '#FF4458';

  if (!data || data.length < 2) {
    const y = (height / 2).toFixed(1);
    return (
      <Svg width={width} height={height}>
        <Polyline
          points={`0,${y} ${width},${y}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = pad + ((max - v) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const linePoints = pts.join(' ');
  const fillPoints = [`0,${height}`, ...pts, `${width},${height}`].join(' ');

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`grad_${positive ? 'g' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Polygon points={fillPoints} fill={`url(#grad_${positive ? 'g' : 'r'})`} />
      <Polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
