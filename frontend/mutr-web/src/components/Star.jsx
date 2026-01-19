import React, { useRef, useMemo } from 'react';
import { Html, MeshDistortMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const emotionColors = {
  "joy": "#FFD54F", "neutral": "#81C784", "sadness": "#64B5F6",
  "anger": "#E57373", "anxiety": "#BA68C8", "embarrassed": "#FFB74D", "hurt": "#F06292"
};

const emotionAdjectives = {
  "joy": "찬란한", "neutral": "고요한", "sadness": "시린",
  "anger": "불타는", "anxiety": "위태로운", "embarrassed": "수줍은", "hurt": "아픈"
};

export default function Star({ node, isSelected, onSelect, onDoubleClick }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const haloRef = useRef();
  
  const pos = [node.x ?? 0, node.y ?? 0, node.z ?? 0];
  const nodeIdString = node.id ? String(node.id) : "";
  const isRoot = node.id === node.rootId;

  const baseColor = useMemo(() => emotionColors[node.emotion] || "#90A4AE", [node.emotion]);
  const adjective = useMemo(() => emotionAdjectives[node.emotion] || "이름 없는", [node.emotion]);
  
  // 루트 노드는 안정감을 위해 일렁임을 거의 멈춤
  const distortAmount = useMemo(() => {
    if (isRoot) return 0.02; 
    const score = node.mutationScore ?? 0;
    return (score * 0.7) + 0.1; 
  }, [node.mutationScore, isRoot]);

  const targetColor = useMemo(() => {
    const color = new THREE.Color(baseColor);
    if (isSelected) return color.clone().add(new THREE.Color("#222222")); 
    return color;
  }, [isSelected, baseColor]);

  // 루트 노드 본체 크기 설정
  const baseScale = isRoot ? 1.3 : 0.8;
  const targetScale = isSelected ? baseScale * 1.3 : baseScale;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    if (materialRef.current) materialRef.current.color.lerp(targetColor, 0.1);
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      if (isRoot) meshRef.current.rotation.y = time * 0.1;
    }

    // ✅ [핵심 변경] 후광 애니메이션 강화
    if (isRoot && haloRef.current) {
        // 1. 크기 대폭 확대: 본체보다 훨씬 큰 범위(1.8배 ~ 2.2배)에서 박동
        // 2. 속도 조절: 더 천천히 웅장하게(time * 0.8) 움직임
        const pulseScale = 2.0 + Math.sin(time * 0.8) * 0.2;
        haloRef.current.scale.set(pulseScale, pulseScale, pulseScale);
        haloRef.current.rotation.y = time * 0.05;
    }
  });

  return (
    <group position={pos}>
      {/* ✅ [핵심 변경] 후광 효과 강화 */}
      {isRoot && (
        <mesh ref={haloRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial
              color={baseColor}
              transparent
              // ✅ 불투명도 대폭 상향 (0.3 -> 0.6): 밝은 하늘 배경에서도 선명하게 보임
              opacity={0.6} 
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
              depthWrite={false}
            />
        </mesh>
      )}

      <mesh 
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          ref={materialRef}
          speed={isRoot ? 1 : 2.5}
          distort={distortAmount}
          radius={1}
          transparent
          opacity={0.95}
          emissive={baseColor}
          emissiveIntensity={isRoot ? 1.2 : (isSelected ? 1.5 : 0.3)}
        />
      </mesh>

      {isSelected && (
        <Html distanceFactor={20} position={[4, 4, 0]}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)',
            border: `8px solid ${baseColor}`,
            padding: '40px',
            borderRadius: '40px',
            color: '#333',
            width: '640px',
            boxShadow: `0 30px 60px rgba(0,0,0,0.15), 0 0 50px ${baseColor}55`,
            fontSize: '32px',
            lineHeight: '1.6',
            fontFamily: '"Pretendard", sans-serif',
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