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

const filterTags = {
  CLUSTER: "공명",   // 변화 낮음 (안정)
  EVOLUTION: "전개", // 변화 중간 (성장)
  MUTATION: "전환"   // 변화 높음 (격변)
};

export default function Star({ node, isSelected, onSelect, onDoubleClick }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const haloRef = useRef();
  const topicRef = useRef(); 
  
  const pos = [node.x ?? 0, node.y ?? 0, node.z ?? 0];
  const nodeIdString = node.id ? String(node.id) : "";
  const isRoot = node.id === node.rootId;

  const baseColor = useMemo(() => emotionColors[node.emotion] || "#90A4AE", [node.emotion]);
  const adjective = useMemo(() => emotionAdjectives[node.emotion] || "이름 없는", [node.emotion]);
  
  // 현재 노드의 필터 유형에 따른 명사 추출
  const currentTag = useMemo(() => filterTags[node.mutationFilter] || "기록", [node.mutationFilter]);

  const displayTopic = useMemo(() => {
    const raw = node.topic || "이름 없는 형체";
    if (raw.length <= 20) return raw;
    const cutStr = raw.slice(0, 20);
    const cleanedStr = cutStr.replace(/\.+$/, "");
    return `${cleanedStr}...`;
  }, [node.topic]);

  const distortAmount = useMemo(() => {
    if (isRoot) return 0.02; 
    const score = node.mutationScore ?? 0;
    return (score * 0.7) + 0.1; 
  }, [node.mutationScore, isRoot]);

  const baseScale = isRoot ? 1.3 : 0.8;
  const targetScale = isSelected ? baseScale * 1.3 : baseScale;

  // 공통 텍스트 스타일 (드래그 방지 포함)
  const topicBaseStyle = {
    color: '#2c3e50',
    fontWeight: '900',
    fontSize: '24px',
    whiteSpace: 'nowrap',
    fontFamily: '"Noto Sans KR", sans-serif',
    WebkitTextStroke: '1.5px #ffffff',
    paintOrder: 'stroke fill',
    transition: 'opacity 0.2s',
    userSelect: 'none',
    WebkitUserSelect: 'none'
  };

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const camera = state.camera;

    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      if (isRoot) meshRef.current.rotation.y = time * 0.1;
    }

    if (isRoot && haloRef.current) {
        const pulseScale = 2.0 + Math.sin(time * 0.8) * 0.2;
        haloRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }

    if (topicRef.current) {
      const distance = camera.position.distanceTo(meshRef.current.getWorldPosition(new THREE.Vector3()));
      const visibleDistance = isRoot ? 60 : 35;
      const fadeDistance = 15; 

      let opacity = 1 - (distance - fadeDistance) / (visibleDistance - fadeDistance);
      opacity = Math.max(0, Math.min(1, opacity));

      topicRef.current.style.opacity = isSelected ? 0 : opacity;
      topicRef.current.style.display = (isSelected || opacity > 0) ? 'block' : 'none';
    }
  });

  return (
    <group position={pos}>
      {/* 1. 노드 위 기본 토픽 */}
      {!isSelected && (
        <Html distanceFactor={25} position={[0, 2.5, 0]} center style={{ pointerEvents: 'none', zIndex: 1 }}>
          <div ref={topicRef} style={topicBaseStyle}>
            {displayTopic}
          </div>
        </Html>
      )}

      {/* 후광 및 본체 로직 */}
      {isRoot && (
        <mesh ref={haloRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false} />
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

      {/* 2. 상세 패널 */}
      {isSelected && (
        <Html distanceFactor={20} position={[4, 4, 0]} center style={{ zIndex: 100 }}>
          <div 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'default' }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
          >
            {/* 패널 위쪽 토픽 */}
            <div style={{ ...topicBaseStyle, marginBottom: '20px' }}>
              {displayTopic}
            </div>

            {/* 패널 본체 */}
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
              animation: 'popIn 0.3s ease-out',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}>
              {/* 패널 내 헤더 텍스트 바로 앞에 태그 추가 */}
              <div style={{ color: baseColor, fontWeight: '900', fontSize: '24px', marginBottom: '20px' }}>
                {`[${currentTag}] ${adjective} 형체 #${nodeIdString} | ${node.authorNickname}`}
              </div>
              
              <div style={{ color: '#2c3e50', wordBreak: 'break-all', fontWeight: '500' }}>
                {node.content}
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}