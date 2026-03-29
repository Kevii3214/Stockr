import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Svg, Text as SvgText } from 'react-native-svg';

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: PieSlice[];
  size?: number;
  innerRadius?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function slicePath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  // Clamp to just under 360 to avoid SVG arc edge case
  const clampedEnd = Math.min(endAngle, startAngle + 359.999);
  const start = polarToCartesian(cx, cy, r, clampedEnd);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function formatTotal(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export default function PieChart({ slices, size = 220, innerRadius = 64 }: Props) {
  const visibleSlices = slices.filter(s => s.value > 0);
  const total = visibleSlices.reduce((s, sl) => s + sl.value, 0);

  if (visibleSlices.length === 0 || total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 3;

  let currentAngle = 0;
  const paths = visibleSlices.map(sl => {
    const angleDeg = (sl.value / total) * 360;
    const path = slicePath(cx, cy, outerR, currentAngle, currentAngle + angleDeg);
    currentAngle += angleDeg;
    return { ...sl, path };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {paths.map((p, i) => (
          <Path key={i} d={p.path} fill={p.color} stroke="#0d0d1a" strokeWidth={2} />
        ))}
        {/* Donut hole */}
        <Circle cx={cx} cy={cy} r={innerRadius} fill="#0d0d0d" />
        {/* Center label */}
        <SvgText
          x={cx}
          y={cy - 9}
          textAnchor="middle"
          fill="#7878a0"
          fontSize={11}
          fontWeight="500"
        >
          Total
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 13}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={17}
          fontWeight="700"
        >
          {formatTotal(total)}
        </SvgText>
      </Svg>

      {/* Legend */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.legendScroll}
        contentContainerStyle={styles.legendContent}
      >
        {visibleSlices.map((sl, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: sl.color }]} />
            <Text style={styles.legendLabel}>{sl.label}</Text>
            <Text style={styles.legendPct}>
              {((sl.value / total) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legendScroll: {
    marginTop: 16,
    width: '100%',
  },
  legendContent: {
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122a',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  legendPct: {
    color: '#7878a0',
    fontSize: 11,
    fontWeight: '500',
  },
});
