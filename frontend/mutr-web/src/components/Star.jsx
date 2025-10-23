import React, { useRef, useMemo } from 'react';
import { Html, MeshDistortMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const emotionColors = {
  "joy": "#FFD54F",
  "neutral": "#81C784",
  "sadness": "#64B5F6",
  "anger": "#E57373",
  "anxiety": "#BA68C8",
  "embarrassed": "#FFB74D",
  "hurt": "#F06292"
};

const emotionAdjectives = {
  "joy": "찬란한",
  "neutral": "고요한",
  "sadness": "시린",
  "anger": "불타는",
  "anxiety": "위태로운",
  "embarrassed": "수줍은",
  "hurt": "아픈"
};

export default function Star({ node, isSelected, onSelect, onDoubleClick }) {
  const meshRef = useRef();
  const materialRef = useRef();
  
  const pos = [node.x ?? 0, node.y ?? 0, node.z ?? 0];
  const nodeIdString = node.id ? String(node.id) : "";

  const baseColor = useMemo(() => emotionColors[node.emotion] || "#90A4AE", [node.emotion]);
  const adjective = useMemo(() => emotionAdjectives[node.emotion] || "이름 없는", [node.emotion]);
  
  // 1. [3단계 핵심] mutationScore에 따른 연속적 일렁임 계산
  // 0.0일 때 최소한의 생동감(0.1) ~ 1.0일 때 강력한 일렁임(0.8)까지 선형적으로 매핑합니다.
  const distortAmount = useMemo(() => {
    const score = node.mutationScore ?? 0;
    return (score * 0.7) + 0.1; 
  }, [node.mutationScore]);

  // 2. 일렁임 속도는 컨셉에 맞춰 일관되게 유지 (필터 영향 제거)
  const distortSpeed = 2.5;

  const targetColor = useMemo(() => {
    const color = new THREE.Color(baseColor);
    if (isSelected) return color.clone().add(new THREE.Color("#111111")); 
    return color;
  }, [isSelected, baseColor]);

  const targetScale = isSelected ? 1.4 : 0.8;

  useFrame(() => {
    if (materialRef.current) materialRef.current.color.lerp(targetColor, 0.1);
    if (meshRef.current) meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <group position={pos}>
      <mesh 
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
      >
        <sphereGeometry args={[1, 64, 64]} />
        {/* ✅ distort 값이 mutationScore에 따라 0.1 ~ 0.8 사이에서 연속적으로 결정됩니다. */}
        <MeshDistortMaterial
          ref={materialRef}
          speed={distortSpeed} 
          distort={distortAmount} 
          radius={1}
          transparent
          opacity={0.95}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 1.8 : 0.4}
        />
      </mesh>

      {isSelected && (
        <Html distanceFactor={20} position={[4, 4, 0]}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)',
            border: `8px solid ${baseColor}`,
            padding: '40px',
            borderRadius: '40px',
            color: '#333',
            width: '640px',
            boxShadow: `0 30px 60px rgba(0,0,0,0.12), 0 0 40px ${baseColor}44`,
            fontSize: '32px',
            lineHeight: '1.6',
            animation: 'popIn 0.3s ease-out'
          }}>
            <div style={{ 
              color: baseColor, 
              fontWeight: '900', 
              fontSize: '24px', 
              marginBottom: '20px',
              filter: 'contrast(1.2)'
            }}>
              {adjective} 형체 #{nodeIdString} | {node.authorNickname}
            </div>
            
            <div style={{ color: '#2c3e50', wordBreak: 'break-all', fontWeight: '500' }}>
              {node.content}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}