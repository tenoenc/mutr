import React, { useRef, useMemo } from 'react';
import { Html, MeshDistortMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. 채도를 높여 더 선명해진 감정 색상 팔레트
const emotionColors = {
  "joy": "#FFD54F",         // 찬란한
  "neutral": "#81C784",     // 고요한
  "sadness": "#64B5F6",     // 시린
  "anger": "#E57373",       // 불타는
  "anxiety": "#BA68C8",     // 위태로운
  "embarrassed": "#FFB74D", // 수줍은
  "hurt": "#F06292"         // 아픈
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

  // 실시간 데이터 바인딩
  const baseColor = useMemo(() => emotionColors[node.emotion] || "#90A4AE", [node.emotion]);
  const adjective = useMemo(() => emotionAdjectives[node.emotion] || "이름 없는", [node.emotion]);
  
  // 2. 선택 시 시각적 임팩트 강화
  // 선택 시 색상이 흐려지지 않고, 해당 색상의 에너지가 응축되어 빛나는 느낌으로 처리
  const targetColor = useMemo(() => {
    const color = new THREE.Color(baseColor);
    if (isSelected) {
      // 선택 시 채도를 유지하며 밝기를 살짝 올려 강조
      return color.clone().add(new THREE.Color("#111111")); 
    }
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
        <MeshDistortMaterial
          ref={materialRef}
          speed={2} 
          distort={0.4} 
          radius={1}
          transparent
          opacity={0.95} // 색감을 더 진하게 표현하기 위해 불투명도 상향
          /* 선택된 노드는 스스로 강하게 빛남 (Glow) */
          emissive={baseColor}
          emissiveIntensity={isSelected ? 1.8 : 0.4}
        />
      </mesh>

      {isSelected && (
        <Html distanceFactor={20} position={[4, 4, 0]}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)',
            border: `8px solid ${baseColor}`, // 패널 테두리에 진해진 색상 반영
            padding: '40px',
            borderRadius: '40px',
            color: '#333',
            width: '640px',
            boxShadow: `0 30px 60px rgba(0,0,0,0.12), 0 0 40px ${baseColor}44`,
            fontSize: '32px',
            lineHeight: '1.6',
            animation: 'popIn 0.3s ease-out'
          }}>
            {/* 패널 구성: [형용사] 형체 #[ID] | [작성자] */}
            <div style={{ 
              color: baseColor, 
              fontWeight: '900', 
              fontSize: '24px', 
              marginBottom: '20px',
              filter: 'contrast(1.2)' // 텍스트 가독성을 위해 대비 강화
            }}>
              {adjective} 형체 #{nodeIdString} | {node.authorNickname}
            </div>
            
            {/* 내용 출력 */}
            <div style={{ color: '#2c3e50', wordBreak: 'break-all', fontWeight: '500' }}>
              {node.content}
            </div>
          </div>
          <style>{`
            @keyframes popIn {
              from { opacity: 0; transform: scale(0.9) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}