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
  const topicRef = useRef(); 
  
  const pos = [node.x ?? 0, node.y ?? 0, node.z ?? 0];
  const nodeIdString = node.id ? String(node.id) : "";
  const isRoot = node.id === node.rootId;

  const baseColor = useMemo(() => emotionColors[node.emotion] || "#90A4AE", [node.emotion]);
  const adjective = useMemo(() => emotionAdjectives[node.emotion] || "이름 없는", [node.emotion]);
  
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

  const topicBaseStyle = {
    color: '#2c3e50',
    fontWeight: '900',
    fontSize: '24px',
    whiteSpace: 'nowrap',
    fontFamily: '"Noto Sans KR", sans-serif',
    WebkitTextStroke: '1.5px #ffffff',
    paintOrder: 'stroke fill',
    transition: 'opacity 0.2s',
    userSelect: 'none', // 텍스트 드래그 방지
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
      {!isSelected && (
        <Html distanceFactor={25} position={[0, 2.5, 0]} center style={{ pointerEvents: 'none', zIndex: 1 }}>
          <div ref={topicRef} style={topicBaseStyle}>
            {displayTopic}
          </div>
        </Html>
      )}

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

      {isSelected && (
        <Html distanceFactor={20} position={[4, 4, 0]} center style={{ zIndex: 100 }}>
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              cursor: 'default'
            }}
            /* 패널 클릭 시 캔버스의 deselection 로직 전파 차단 */
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            /* 패널 더블 클릭 시 별 더블 클릭과 동일한 동작 수행 */
            onDoubleClick={(e) => { 
              e.stopPropagation(); 
              onDoubleClick(node); 
            }}
          >
            <div style={{ ...topicBaseStyle, marginBottom: '20px' }}>
              {displayTopic}
            </div>

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
              userSelect: 'none', // 패널 내 텍스트 드래그 방지
              WebkitUserSelect: 'none' // 크로스 브라우징 지원
            }}>
              <div style={{ color: baseColor, fontWeight: '900', fontSize: '24px', marginBottom: '20px' }}>
                {adjective} 형체 #{nodeIdString} | {node.authorNickname}
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