import { useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

/**
 * Movement: 사용자의 입력을 감지하여 카메라의 위치(WSAD)와 회전(Mouse Drag)을 제어하는 컴포넌트
 * @param {Function} onInterrupt - 자동 카메라 이동(예: 특정 노드로 이동) 중 사용자가 개입할 때 호출되는 콜백
 */
export default function Movement({ onInterrupt }) {
  // KeyboardControls에서 정의된 키 입력 상태를 가져옴
  const [, getKeys] = useKeyboardControls();
  const { camera, gl } = useThree();
  
  // 드래그 상태 및 이전 마우스 좌표 관리
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });

  /**
   * 마우스를 이용한 시선 회전 로직 (Pointer Events)
   */
  useEffect(() => {
    // 1. 마우스 클릭 시 시선 조작 시작
    const handleDown = (e) => {
        // 입력창(INPUT)이나 UI 요소 클릭 시에는 카메라 회전 방지
        if (e.target.tagName === 'INPUT' || e.target.closest('.continue-bubble')) return;
    
        isDragging.current = true;
        prevMouse.current = { x: e.clientX, y: e.clientY }; 
    
        // 쿼터니언(Quaternion)으로 관리되는 회전값을 오일러(Euler)로 변환하여 동기화
        // 자동 이동 애니메이션 중 마우스 클릭 시 즉시 중단하고 수동 조작으로 전환하기 위함
        camera.rotation.setFromQuaternion(camera.quaternion);
    
        // 사용자의 명시적인 조작이 발생했으므로 자동 이동 중단 알림
        if (onInterrupt) onInterrupt();
    };

    // 2. 클릭 해제 시 시선 조작 종료
    const handleUp = () => { isDragging.current = false; };

    // 3. 마우스 이동량에 따른 카메라 회전값 계산
    const handleMove = (e) => {
      if (!isDragging.current) return;
      
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      
      // 회전 순서 설정 (Y축 회전 후 X축 회전)
      camera.rotation.order = 'YXZ';
      
      // 마우스 감도(0.002)를 곱하여 회전 반영
      camera.rotation.y -= dx * 0.002;
      camera.rotation.x -= dy * 0.002;
      
      // 화면이 뒤집히지 않도록 수직 회전각(Pitch) 제한 (약 85도)
      camera.rotation.x = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, camera.rotation.x));
      
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };

    // 캔버스 요소 및 윈도우에 이벤트 리스너 등록
    gl.domElement.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointermove', handleMove);
    
    return () => {
      gl.domElement.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointermove', handleMove);
    };
  }, [camera, gl, onInterrupt]);

  /**
   * 키보드 입력을 이용한 위치 이동 로직 (매 프레임 실행)
   */
  useFrame((state) => {
    // 입력창에 포커스가 있는 경우에는 이동 로직 정지
    if (document.activeElement.tagName === 'INPUT') return;
  
    const { forward, backward, left, right } = getKeys();
    
    // 이동 키 입력 시 자동 카메라 애니메이션 즉시 중단
    if (forward || backward || left || right) {
        if (onInterrupt) onInterrupt();
    }

    // 카메라의 로컬 축을 기준으로 위치 이동 (translate)
    const vel = 1.2; // 이동 속도 설정
    if (forward) state.camera.translateZ(-vel); // 전진 (Z축 음수)
    if (backward) state.camera.translateZ(vel);  // 후진 (Z축 양수)
    if (left) state.camera.translateX(-vel);    // 왼쪽 (X축 음수)
    if (right) state.camera.translateX(vel);     // 오른쪽 (X축 양수)
});

  return null; // 시각적 요소 없이 로직만 담당하는 컴포넌트
}