import React from 'react';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';

interface TargetSVGProps {
  type: 'normal' | 'golden' | 'trap';
  size?: number;
}

export const TargetSVG: React.FC<TargetSVGProps> = ({ type, size = 64 }) => {
  if (type === 'normal') {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Outer Ring */}
        <Circle cx="32" cy="32" r="28" fill="#0EA5E9" opacity="0.3" />
        <Circle cx="32" cy="32" r="24" stroke="#38BDF8" strokeWidth="4" fill="#090D16" />
        {/* Middle Ring */}
        <Circle cx="32" cy="32" r="16" fill="#0284C7" />
        <Circle cx="32" cy="32" r="10" fill="#F8FAFC" />
        {/* Bullseye Center */}
        <Circle cx="32" cy="32" r="5" fill="#38BDF8" />
      </Svg>
    );
  }

  if (type === 'golden') {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Glowing Aura */}
        <Circle cx="32" cy="32" r="28" fill="#F59E0B" opacity="0.4" />
        <Circle cx="32" cy="32" r="24" stroke="#FBBF24" strokeWidth="4" fill="#78350F" />
        {/* Star Icon Center */}
        <Polygon
          points="32,16 36,26 47,26 38,32 41,43 32,36 23,43 26,32 17,26 28,26"
          fill="#FBBF24"
          stroke="#FFF"
          strokeWidth="1"
        />
      </Svg>
    );
  }

  if (type === 'trap') {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Danger Ring */}
        <Circle cx="32" cy="32" r="28" fill="#EF4444" opacity="0.4" />
        <Circle cx="32" cy="32" r="24" stroke="#F87171" strokeWidth="4" fill="#450A0A" />
        {/* Cross Skull / Danger Marks */}
        <Path d="M 20 20 L 44 44 M 44 20 L 20 44" stroke="#F87171" strokeWidth="6" strokeLinecap="round" />
      </Svg>
    );
  }

  return null;
};
