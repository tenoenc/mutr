import React, { useRef, useMemo } from 'react';
import { Html, MeshDistortMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 감정 상태에 따른 시각적 색상 매핑
 */
const emotionColors = {
  "joy": "#FFD54F", "neutral": "#81C784", "sadness": "#64B5F6",
  "anger": "#E57373", "anxiety": "#BA68C8", "embarrassed": "#FFB74D", "hurt": "#F06292"
};

/**
 * 감정 상태에 따른 수식어 매핑
 */
const emotionAdjectives = {
  "joy": "찬란한", "neutral": "고요한", "sadness": "시린",
  "anger": "불타는", "anxiety": "위태로운", "embarrassed": "수줍은", "hurt": "아픈"
};

/**
 * 데이터 변화량(Mutation) 필터에 따른 태그 매핑
 */
const filterTags = {
  CLUSTER: "공명",   // 변화 낮음 (안정)
  EVOLUTION: "전개", // 변화 중간 (성장)
  MUTATION: "전환"   // 변화 높음 (격변)
};

/**
 * Star: 개별 노드를 3D 별 형태로 렌더링하고 상세 정보를 표시하는 컴포넌트
 */
export default function Star({ node, isSelected, onSelect, onDoubleClick }) {
  // 3D 메쉬 및 HTML 요소 제어를 위한 레퍼런스
  const meshRef = useRef();
  const materialRef = useRef();
  const haloRef = useRef();
  const topicRef = useRef(); 
  
  // 노드 좌표 및 상태 값 계산
  const pos = [node.x ?? 0, node.y ?? 0, node.z ?? 0];
  const nodeIdString = node.id ? String(node.id) : "";
  const isRoot = node.id === node.rootId; // 최상위 노드 여부 확인

  // 메모이제이션을 통한 시각적 속성 최적화
  const baseColor = useMemo(() => emotionColors[node.emotion] || "#90A4AE", [node.emotion]);
  const adjective = useMemo(() => emotionAdjectives[node.emotion] || "이름 없는", [node.emotion]);
  const currentTag = useMemo(() => filterTags[node.mutationFilter] || "기록", [node.mutationFilter]);

  // 토픽 텍스트 길이에 따른 생략 처리
  const displayTopic = useMemo(() => {
    const raw = node.topic || "이름 없는 형체";
    if (isSelected) return raw;
    if (raw.length <= 20) return raw;
    const cutStr = raw.slice(0, 20);
    const cleanedStr = cutStr.replace(/\.+$/, "");
    return `${cleanedStr}...`;
  }, [node.topic, isSelected]);

  // 변화 점수에 따른 메쉬 왜곡(Distortion) 정도 계산
  const distortAmount = useMemo(() => {
    if (isRoot) return 0.02; 
    const score = node.mutationScore ?? 0;
    return (score * 0.7) + 0.1; 
  }, [node.mutationScore, isRoot]);

  // 노드 크기 설정 (루트 노드거나 선택된 경우 확대)
  const baseScale = isRoot ? 1.3 : 0.8;
  const targetScale = isSelected ? baseScale * 1.3 : baseScale;

  // HTML 오버레이 텍스트 스타일 정의
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

  /**
   * 프레임별 애니메이션 및 상태 업데이트
   */
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const camera = state.camera;

    // 1. 크기 보간 및 루트 노드 회전 애니메이션
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      if (isRoot) meshRef.current.rotation.y = time * 0.1;
    }

    // 2. 루트 노드 전용 후광(Halo) 맥동 애니메이션
    if (isRoot && haloRef.current) {
        const pulseScale = 2.0 + Math.sin(time * 0.8) * 0.2;
        haloRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }

    // 3. 카메라와의 거리에 따른 토픽 텍스트 투명도 조절 (Fading)
    if (topicRef.current) {
      const distance = camera.position.distanceTo(meshRef.current.getWorldPosition(new THREE.Vector3()));
      const visibleDistance = isRoot ? 60 : 35; // 보이기 시작하는 거리
      const fadeDistance = 15; // 완전히 투명해지는 시작 거리

      let opacity = 1 - (distance - fadeDistance) / (visibleDistance - fadeDistance);
      opacity = Math.max(0, Math.min(1, opacity));

      topicRef.current.style.opacity = isSelected ? 0 : opacity;
      topicRef.current.style.display = (isSelected || opacity > 0) ? 'block' : 'none';
    }
  });

  return (
    <group position={pos}>
      {/* 1. 노드 상단에 표시되는 부유형 토픽 (Html) */}
      {!isSelected && (
        <Html distanceFactor={25} position={[0, 2.5, 0]} center style={{ pointerEvents: 'none', zIndex: 1 }}>
          <div ref={topicRef} style={topicBaseStyle}>
            {displayTopic}
          </div>
        </Html>
      )}

      {/* 2. 루트 노드 전용 후광 효과 메쉬 */}
      {isRoot && (
        <mesh ref={haloRef}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.5} blending={THREE.AdditiveBlending} side={THREE.BackSide} depthWrite={false} />
        </mesh>
      )}

      {/* 3. 메인 별(Star) 본체 메쉬 */}
      <mesh 
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }} // 클릭 시 선택 상태 전환
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }} // 더블 클릭 시 카메라 이동
      >
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          ref={materialRef}
          speed={isRoot ? 1 : 2.5}
          distort={distortAmount}
          radius={1}
          transparent
          opacity={0.95}
          emissive={baseColor} // 감정에 따른 자체 발광 효과
          emissiveIntensity={isRoot ? 1.2 : (isSelected ? 1.5 : 0.3)}
        />
      </mesh>

      {/* 4. 노드 선택 시 나타나는 상세 정보 패널 */}
      {isSelected && (
        <Html distanceFactor={20} position={[4, 4, 0]} center style={{ zIndex: 100 }}>
          <div 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'default' }}
            onPointerDown={(e) => e.stopPropagation()} // 캔버스 조작 방해 금지
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}
          >
            {/* 패널 상단 강조 토픽 */}
            <div style={{ ...topicBaseStyle, marginBottom: '20px' }}>
              {displayTopic}
            </div>

            {/* 정보 카드 본체 */}
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
              {/* 노드 메타 정보 헤더 */}
              <div style={{ color: baseColor, fontWeight: '900', fontSize: '24px', marginBottom: '20px' }}>
                {`[${currentTag}] ${adjective} 형체 #${nodeIdString} | ${node.authorNickname}`}
              </div>
              
              {/* 본문 텍스트 */}
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