import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

/**
 * 카메라의 이동 거리를 감시하여 일정 거리 이상 움직였을 때 이벤트를 발생시키는 컴포넌트
 * @param {Function} onMoveThreshold - 임계값 이상 이동했을 때 실행할 콜백 함수
 */
export default function SceneController({ onMoveThreshold }) {
  // 1. R3F의 상태에서 현재 활성화된 카메라 객체를 가져옵니다.
  const { camera } = useThree();

  // 2. 마지막으로 이벤트를 발생시켰던 카메라의 위치를 저장하는 Ref입니다.
  // 리렌더링을 유발하지 않으면서 값을 유지하기 위해 useRef를 사용합니다.
  const lastPos = useRef(new THREE.Vector3(0, 0, 0));

  // 3. useFrame은 매 프레임(약 초당 60회)마다 실행됩니다.
  useFrame(() => {
    // 현재 카메라의 위치와 마지막 저장 위치 사이의 거리를 계산합니다.
    const distance = camera.position.distanceTo(lastPos.current);

    // 4. 이동 거리가 150 유닛(Three.js 단위)을 초과했는지 확인합니다.
    if (distance > 150) {
      // 조건을 만족하면 현재 위치를 lastPos에 업데이트하여 기준점을 갱신합니다.
      lastPos.current.copy(camera.position);

      // 부모 컴포넌트에서 넘겨받은 콜백 함수를 실행하며 현재 카메라 위치를 전달합니다.
      onMoveThreshold(camera.position);
    }
  });

  // 이 컴포넌트는 화면에 무언가를 그리지는 않으므로 null을 반환합니다.
  return null;
}