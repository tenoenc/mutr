import React, { useState, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

// API 통신 및 실시간 통신을 위한 모듈
import api from './api/axios'; 
import { useStompSubscription } from './api/socket.js';

// 3D 오브젝트 및 UI 컴포넌트
import Star from './components/Star';
import Movement from './components/Movement';
import NodeInput from './components/NodeInput';
import SceneController from './components/SceneController';
import RelationLines from './components/RelationLines';
import HeaderNickname from './components/HeaderNickname';

/**
 * CameraController: 특정 노드 선택 시 카메라를 해당 위치로 부드럽게 이동시키는 컴포넌트
 */
function CameraController({ cameraTarget, setCameraTarget, setCamera }) {
    const { camera } = useThree();

    // 초기 마운트 시 메인 카메라 객체를 상위 상태로 전달
    useEffect(() => { if (camera && setCamera) setCamera(camera); }, [camera, setCamera]);

    // 매 프레임마다 카메라의 위치와 회전을 타겟 노드에 맞춰 보간(lerp/slerp) 수행
    useFrame((state) => {
      if (cameraTarget) {
        const nodePos = new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z);
        
        // 노드로부터 일정한 거리(20단위)를 유지하는 목표 지점 계산
        const dirFromNode = new THREE.Vector3().subVectors(state.camera.position, nodePos).normalize();
        const targetPos = new THREE.Vector3().copy(nodePos).add(dirFromNode.multiplyScalar(20));
        
        // 위치 이동 보간 (Linear Interpolation)
        state.camera.position.lerp(targetPos, 0.07);
        
        // 회전값 보간 (Spherical Linear Interpolation)을 통해 노드를 정면으로 응시
        const targetQuat = new THREE.Quaternion();
        const dummy = state.camera.clone();
        dummy.lookAt(nodePos);
        targetQuat.copy(dummy.quaternion);
        state.camera.quaternion.slerp(targetQuat, 0.07);
        
        // 목표 지점에 충분히 도달하면 타겟팅 해제
        if (state.camera.position.distanceTo(targetPos) < 0.1) setCameraTarget(null);
      }
    });
    return null;
}

/**
 * GalaxyScene: 3D 우주 공간과 노드 시스템의 메인 컨테이너 컴포넌트
 */
function GalaxyScene() {
    // 상태 관리: 노드 목록, 선택된 노드, 카메라 레퍼런스, 카메라 이동 타겟
    const [nodes, setNodes] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [mainCamera, setMainCamera] = useState(null);
    const [cameraTarget, setCameraTarget] = useState(null);

    // 선택된 노드 객체 파생
    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    // 카메라를 특정 노드 좌표로 이동시키는 핸들러
    const moveToNode = useCallback((node) => {
        setCameraTarget({ x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 });
    }, []);

    /**
     * fetchNearby: 현재 좌표를 기준으로 일정 범위 내의 노드 데이터를 서버에서 조회
     */
    const fetchNearby = useCallback((currentPos) => {
        api.get('/api/v1/nodes/viz', {
            params: { x: currentPos.x, y: currentPos.y, z: currentPos.z, range: 1000 }
        }).then(res => {
            const serverNodes = res.data.data || [];
            setNodes(prev => {
                // 기존 노드들 중 일정 범위 내의 데이터만 유지하고 서버에서 받은 새로운 데이터와 병합(중복 제거)
                const map = new Map(prev.filter(n => new THREE.Vector3(n.x, n.y, n.z).distanceTo(currentPos) < 2500).map(n => [n.id, n]));
                serverNodes.forEach(n => map.set(n.id, n));
                return Array.from(map.values());
            });
        });
    }, []);

    // 컴포넌트 마운트 시 초기 위치(0, 0, 30) 근처의 노드 로드
    useEffect(() => {
        fetchNearby(new THREE.Vector3(0, 0, 30));
    }, [fetchNearby]);

    /**
     * 실시간 데이터 구독: 웹소켓을 통해 다른 사용자의 노드 생성이나 AI 분석 결과를 실시간으로 수신
     */
    useStompSubscription('/topic/galaxy/public', (newNode) => {
        // 동일한 ID를 가진 노드를 교체하여 상태 업데이트 (분석 결과 반영 등)
        setNodes(prev => [...prev.filter(n => n.id !== newNode.id), newNode]);
    });

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* Overlay UI: 상단 유저 닉네임 표시부 */}
            <HeaderNickname />

            {/* 3D 렌더링 영역 (KeyboardControls로 이동 키 입력 감지) */}
            <KeyboardControls map={[
                { name: 'forward', keys: ['w', 'W'] },
                { name: 'backward', keys: ['s', 'S'] },
                { name: 'left', keys: ['a', 'A'] },
                { name: 'right', keys: ['d', 'D'] },
            ]}>
                <Canvas gl={{ alpha: true, antialias: true }} onPointerMissed={() => setSelectedNodeId(null)}>
                    {/* 카메라 제어 로직 */}
                    <CameraController cameraTarget={cameraTarget} setCameraTarget={setCameraTarget} setCamera={setMainCamera} />
                    
                    {/* 씬 조명 설정 */}
                    <ambientLight intensity={0.7} />
                    
                    {/* 카메라 이동 및 경계 감지 로직 */}
                    <Movement onInterrupt={() => setCameraTarget(null)} />
                    <SceneController onMoveThreshold={fetchNearby} />
                    
                    {/* 노드 간 관계선 및 개별 별(Star) 렌더링 */}
                    <RelationLines nodes={nodes} selectedNodeId={selectedNodeId} />
                    {nodes.map(node => (
                        <Star 
                            key={node.id} 
                            node={node} 
                            isSelected={node.id === selectedNodeId} 
                            onSelect={setSelectedNodeId} 
                            onDoubleClick={moveToNode} 
                        />
                    ))}
                </Canvas>
            </KeyboardControls>

            {/* Overlay UI: 하단 노드 입력 인터페이스 */}
            <NodeInput 
                camera={mainCamera} 
                selectedNode={selectedNode}
                onNodeCreated={(newNode) => { 
                    setSelectedNodeId(newNode.id); 
                    moveToNode(newNode); 
                }}
                onMoveToNode={moveToNode}
            />
        </div>
    );
}

export default GalaxyScene;