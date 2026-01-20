import React, { useState } from 'react';
import * as THREE from 'three';
import axios from 'axios';

export default function NodeInput({ camera, selectedNode, onNodeCreated, onMoveToNode }) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || !camera) return;
  
    try {
      // 1. 카메라의 전방 방향 벡터(Direction Vector) 추출
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction); // 카메라가 바라보는 방향을 direction 변수에 담음
  
      // 2. 고정 거리 설정 및 생성 좌표 계산
      const distance = 20;
      const spawnPos = new THREE.Vector3()
        .copy(camera.position)
        .add(direction.clone().multiplyScalar(distance));
  
      // 3. API 요청 바디에 방향 정보 포함
      const requestBody = {
        content: content,
        x: spawnPos.x,
        y: spawnPos.y,
        z: spawnPos.z,
        parentId: selectedNode ? selectedNode.id : null,
        // ✅ 방향 정보 추가 (정규화된 벡터값)
        dirX: direction.x,
        dirY: direction.y,
        dirZ: direction.z
      };
  
      const response = await axios.post('http://localhost:8080/api/v1/nodes', requestBody);
  
      const newNode = response.data.data || response.data;
      setContent(""); 
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
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 이어하기 버튼 (인풋창 바로 위) */}
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
      
      <form onSubmit={handleSubmit}>
        <input 
          autoFocus
          value={content} 
          onChange={e => setContent(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation(); // 캔버스로 이벤트 전파 차단
            if (e.key === 'Enter' && e.nativeEvent.isComposing) return; // 한글 중복 입력 방지
          }}
          placeholder="기록을 남기고 엔터를 누르세요..."
          style={{ 
            background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)',
            border: '2px solid white', padding: '18px 40px', borderRadius: '50px',
            width: '600px', fontSize: '18px', outline: 'none', color: '#333',
            textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
          }}
        />
        <button type="submit" style={{ display: 'none' }} />
      </form>
    </div>
  );
}