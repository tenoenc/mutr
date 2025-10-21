import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function PollenEffect({ position }) {
  const count = 40;
  const meshRef = useRef();
  
  // 파티클의 초기 속도와 방향 설정
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const speed = 0.05 + Math.random() * 0.1;
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed
      );
      temp.push({ velocity, pos: new THREE.Vector3(0, 0, 0), alpha: 1 });
    }
    return temp;
  }, []);

  const dummy = new THREE.Object3D();

  useFrame(() => {
    particles.forEach((p, i) => {
      p.pos.add(p.velocity);
      p.alpha -= 0.01; // 서서히 사라짐
      
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(p.alpha > 0 ? p.alpha * 0.2 : 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} position={position}>
      <sphereGeometry args={[0.5, 8, 8]} />
      <meshBasicMaterial color="#ff9a9e" transparent opacity={0.6} />
    </instancedMesh>
  );
}
