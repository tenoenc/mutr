import React, { useRef } from 'react';
import { Html, MeshDistortMaterial } from '@react-three/drei'; // 흐물흐물한 효과를 위해 Distort 사용
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Star({ node, isSelected, onSelect, onDoubleClick }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const pos = [node.x ?? 0, node.y ?? 0, node.z ?? 0];
  const nodeIdString = node.id ? String(node.id) : "";

  // 핑크색을 제외하고 차분한 블루/라벤더 톤으로 변경
  const targetColor = new THREE.Color(isSelected ? "#8ba3cf" : "#bac8e0");
  const targetScale = isSelected ? 1.5 : 0.8;

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
        {/* ✅ '생각'을 상징하는 흐물흐물한 질감 복원 */}
        <MeshDistortMaterial
          ref={materialRef}
          speed={2.5} 
          distort={0.5} 
          radius={1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {isSelected && (
        <Html distanceFactor={20} position={[4, 4, 0]}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(15px)',
            border: '6px solid #8ba3cf',
            padding: '48px',
            borderRadius: '60px',
            color: '#111',
            width: '760px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.15)',
            fontSize: '36px',
            lineHeight: '1.7',
            animation: 'slideUp 0.4s ease-out'
          }}>
            {/* ✅ "전달된 생각 씨앗" 제거 후 ID 배치 */}
            <div style={{ 
              color: '#5b7bb1', 
              fontWeight: 'bold', 
              fontSize: '28px', 
              marginBottom: '24px'
            }}>
              ID: {nodeIdString}
            </div>
            {node.content}
          </div>
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(40px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </Html>
      )}
    </group>
  );
}