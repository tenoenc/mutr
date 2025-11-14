import React, { useState } from 'react';
import * as THREE from 'three';
import api from '../api/axios'; // 인증 인터셉터가 포함된 axios 인스턴스

/**
 * NodeInput: 사용자의 텍스트 입력을 받아 3D 공간상에 새로운 노드를 생성하는 컴포넌트
 * @param {THREE.Camera} camera - 현재 씬의 메인 카메라 (좌표 계산용)
 * @param {Object} selectedNode - 현재 선택된 부모 노드 객체
 * @param {Function} onNodeCreated - 노드 생성 성공 시 호출되는 콜백
 * @param {Function} onMoveToNode - 카메라를 특정 노드로 이동시키는 콜백
 */
export default function NodeInput({ camera, selectedNode, onNodeCreated, onMoveToNode }) {
  const [content, setContent] = useState("");

  /**
   * handleSubmit: 입력된 텍스트와 카메라의 물리적 상태를 서버로 전송
   */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || !camera) return;
  
    try {
      // 1. 카메라가 현재 바라보고 있는 정면 방향 벡터(Normalized) 추출
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
  
      // 2. 새로운 노드가 생성될 3D 좌표 계산
      // 카메라 위치에서 바라보는 방향으로 20단위만큼 떨어진 지점을 생성 위치로 설정
      const distance = 20;
      const spawnPos = new THREE.Vector3()
        .copy(camera.position)
        .add(direction.clone().multiplyScalar(distance));
  
      // 3. 백엔드 전송을 위한 데이터 구조 생성
      const requestBody = {
        content: content,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        parentId: selectedNode ? selectedNode.id : null, // 선택된 노드가 있다면 부모로 지정
        // 노드 간의 관계선 방향을 결정하기 위한 벡터 정보 포함
        dirX: direction.x,
        dirY: direction.y,
        dirZ: direction.z
      };

      // API 서버로 노드 생성 요청 전송
      // const response = await api.post('http://localhost:8080/api/v1/nodes', requestBody);
      const response = await api.post('/v1/nodes', requestBody);
  
      const newNode = response.data.data || response.data;
      setContent(""); // 입력창 초기화
      
      // 상위 컴포넌트에 생성 완료 알림 및 새 노드 전달
      if (onNodeCreated) onNodeCreated(newNode);
    } catch (err) {
      console.error("❌ 전송 에러:", err);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', bottom: '50px', left: '50%', transform: 'translateX(-50%)', 
        zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center' 
      }} 
      // 캔버스 드래그 등 3D 조작 이벤트가 입력창 영역에서 간섭되지 않도록 차단
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 1. 이어하기 안내: 특정 노드가 선택되었을 때만 나타나는 안내 버블 */}
      {selectedNode && (
        <div 
          onClick={() => onMoveToNode(selectedNode)}
          className="continue-bubble"
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)', padding: '12px 24px', 
            borderRadius: '25px', fontSize: '15px', marginBottom: '15px',
            cursor: 'pointer', color: '#5b7bb1', border: '2px solid #8ba3cf',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)', fontWeight: '600'
          }}
        >
          ID {selectedNode.id}에서 이어하기
        </div>
      )}
      
      {/* 2. 메인 입력 폼 */}
      <form onSubmit={handleSubmit}>
        <input 
          autoFocus // 페이지 로드 시 즉시 입력 가능 상태로 설정
          value={content} 
          onChange={e => setContent(e.target.value)}
          onKeyDown={(e) => {
            // 키 입력 이벤트가 3D 씬의 카메라 조작(W,A,S,D)으로 전달되지 않도록 차단
            e.stopPropagation(); 
            
            // 한글 입력 시 엔터 키 중복 이벤트 발생(isComposing) 방지
            if (e.key === 'Enter' && e.nativeEvent.isComposing) return; 
          }}
          placeholder="기록을 남기고 엔터를 누르세요..."
          style={{ 
            background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)',
            border: '2px solid white', padding: '18px 40px', borderRadius: '50px',
            width: '600px', fontSize: '18px', outline: 'none', color: '#333',
            textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}
        />
        {/* 엔터 키 제출을 위한 숨겨진 버튼 */}
        <button type="submit" style={{ display: 'none' }} />
      </form>
    </div>
  );
}