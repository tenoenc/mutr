import { Stars } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';

export default function InfiniteStars() {
  const { camera } = useThree();
  const ref = useRef();
  useFrame(() => { if (ref.current) ref.current.position.copy(camera.position); });
  return <Stars ref={ref} radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />;
}