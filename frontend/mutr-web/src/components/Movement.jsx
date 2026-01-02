import { useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';

/**
 * Movement: 사용자의 입력을 감지하여 카메라의 위치(WSAD)와 회전(Mouse Drag)을 제어하는 컴포넌트
 * @param {Function} onInterrupt - 자동 카메라 이동(예: 특정 노드로 이동) 중 사용자가 개입할 때 호출되는 콜백
 */
export default function Movement({ onInterrupt, joystickRef }) {
  // KeyboardControls에서 정의된 키 입력 상태를 가져옴
  const [, getKeys] = useKeyboardControls();
  const { camera, gl } = useThree();
  
  // 드래그 상태 관리
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const draggingPointerId = useRef(null); // 현재 드래그 중인 손가락 ID 추적

  // 1. 시선 회전 로직 (터치 드래그)
  useEffect(() => {
    // 1. 마우스 클릭 시 시선 조작 시작
    const handleDown = (e) => {
        // 이미 다른 손가락으로 드래그 중이라면 무시
        if (isDragging.current) return;
        // 입력창(INPUT)이나 UI 요소 클릭 시에는 카메라 회전 방지
        if (e.target.tagName === 'INPUT' || e.target.closest('.continue-bubble')) return;
    
        isDragging.current = true;
        draggingPointerId.current = e.pointerId;
        prevMouse.current = { x: e.clientX, y: e.clientY }; 
    
        // 쿼터니언(Quaternion)으로 관리되는 회전값을 오일러(Euler)로 변환하여 동기화
        // 자동 이동 애니메이션 중 마우스 클릭 시 즉시 중단하고 수동 조작으로 전환하기 위함
        camera.rotation.setFromQuaternion(camera.quaternion);
    
        // 사용자의 명시적인 조작이 발생했으므로 자동 이동 중단 알림
        if (onInterrupt) onInterrupt();
    };

    // 2. 클릭 해제 시 시선 조작 종료
    const handleUp = (e) => {
      // 드래그하던 손가락이 떨어졌을 때만 해제
      if (e.pointerId === draggingPointerId.current) {
        isDragging.current = false;
        draggingPointerId.current = null;
      }
    };

    // 3. 마우스 이동량에 따른 카메라 회전값 계산
    const handleMove = (e) => {
      // 드래그 중이 아니거나, 드래그를 시작한 손가락이 아니면 무시 (조이스틱 터치 간섭 방지)
      if (!isDragging.current || e.pointerId !== draggingPointerId.current) return;
      
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

  // 2. 이동 로직 (키보드 + 조이스틱)
  useFrame((state) => {
    // 입력창 포커스 시 키보드 이동만 차단
    const isTyping = document.activeElement.tagName === 'INPUT';
    const { forward, backward, left, right } = isTyping 
      ? { forward: false, backward: false, left: false, right: false } 
      : getKeys();
  
    // 조이스틱 값 가져오기 (없으면 0)
    const joyY = joystickRef?.current?.y || 0;
    const joyX = joystickRef?.current?.x || 0;

    // 조작 감지 (키보드 또는 조이스틱)
    const isMoving = forward || backward || left || right || Math.abs(joyY) > 0.1 || Math.abs(joyX) > 0.1;

    if (isMoving) {
      if (onInterrupt) onInterrupt();
      
      const speed = 0.8;

      // 복잡한 벡터 계산 대신 로컬 좌표 이동 함수 사용
      // translateX/Z는 카메라가 '바라보는 방향'을 기준으로 이동합니다.

      // 1. 전진/후진 (Z축)
      // Three.js에서 카메라는 -Z 방향을 바라봅니다.
      // 전진하려면 Z값을 줄여야 하고(-), 후진하려면 늘려야 합니다(+)
      let moveZ = 0;
      if (forward) moveZ -= speed;        // 전진
      if (backward) moveZ += speed;       // 후진
      if (Math.abs(joyY) > 0) moveZ -= joyY * speed; // 조이스틱 위로 밀면(-Z) 전진

      // 2. 좌/우 (X축)
      let moveX = 0;
      if (right) moveX += speed;          // 우측 이동
      if (left) moveX -= speed;           // 좌측 이동
      if (Math.abs(joyX) > 0) moveX += joyX * speed; // 조이스틱 방향대로 이동

      // 3. 이동 적용
      camera.translateX(moveX);
      camera.translateZ(moveZ);
    }
  });

  return null; // 시각적 요소 없이 로직만 담당하는 컴포넌트
}