import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function SceneController({ onMoveThreshold }) {
  const { camera } = useThree();
  const lastPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (camera.position.distanceTo(lastPos.current) > 150) {
      lastPos.current.copy(camera.position);
      onMoveThreshold(camera.position);
    }
  });
  return null;
}