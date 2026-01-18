/* src/components/Movement.jsx */
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

export default function Movement({ onInterrupt }) {
  const [, getKeys] = useKeyboardControls();
  const { camera, gl } = useThree();
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleDown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.closest('.continue-bubble')) return;
    
        isDragging.current = true;
        prevMouse.current = { x: e.clientX, y: e.clientY }; 
    
        // 애니메이션 중단 시 현재 카메라의 쿼터니언을 오일러 회전값으로 즉시 동기화
        camera.rotation.setFromQuaternion(camera.quaternion);
    
        if (onInterrupt) onInterrupt();
    };

    const handleUp = () => { isDragging.current = false; };
    const handleMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      camera.rotation.order = 'YXZ';
      camera.rotation.y -= dx * 0.002;
      camera.rotation.x -= dy * 0.002;
      camera.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, camera.rotation.x));
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    gl.domElement.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointermove', handleMove);
    return () => {
      gl.domElement.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointermove', handleMove);
    };
  }, [camera, gl, onInterrupt]);

  useFrame((state) => {
    if (document.activeElement.tagName === 'INPUT') return;
  
    const { forward, backward, left, right } = getKeys();
    // ✅ 키보드 입력 시에도 애니메이션 즉시 중단
    if (forward || backward || left || right) {
        if (onInterrupt) onInterrupt();
    }

    const vel = 1.2;
    if (forward) state.camera.translateZ(-vel);
    if (backward) state.camera.translateZ(vel);
    if (left) state.camera.translateX(-vel);
    if (right) state.camera.translateX(vel);
});

  return null;
}