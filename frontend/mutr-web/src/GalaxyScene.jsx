import React, { useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';
import * as THREE from 'three';

import Star from './components/Star';
import Movement from './components/Movement';
import NodeInput from './components/NodeInput';
import SceneController from './components/SceneController';
import RelationLines from './components/RelationLines';

// 📸 카메라 부드러운 이동 및 방향 전환 컨트롤러
function CameraController({ cameraTarget, setCameraTarget, setCamera }) {
    const { camera } = useThree();
  
    useEffect(() => {
        if (camera && setCamera) setCamera(camera);
    }, [camera, setCamera]);

    useFrame((state) => {
      if (cameraTarget) {
        const nodePos = new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z);
        
        // 1. 현재 카메라 위치에서 노드 방향으로의 벡터 계산
        const dirFromNode = new THREE.Vector3()
            .subVectors(state.camera.position, nodePos)
            .normalize();

        // 2. 노드로부터 현재 사용자 방향으로 20m 떨어진 지점을 목표로 설정
        const targetPos = new THREE.Vector3()
            .copy(nodePos)
            .add(dirFromNode.multiplyScalar(20));
        
        // 위치 이동 (기존 시선 방향 경로 유지)
        state.camera.position.lerp(targetPos, 0.07);
  
        // 방향 전환 (노드를 정중앙에 놓기 위한 부드러운 회전)
        const targetQuat = new THREE.Quaternion();
        const dummy = state.camera.clone();
        dummy.lookAt(nodePos);
        targetQuat.copy(dummy.quaternion);
        state.camera.quaternion.slerp(targetQuat, 0.07);
  
        // 충분히 가까워지면 타겟 해제
        if (state.camera.position.distanceTo(targetPos) < 0.1) {
            setCameraTarget(null);
        }
      }
    });
    return null;
}

function GalaxyScene() {
    const [nodes, setNodes] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [mainCamera, setMainCamera] = useState(null);
    const [cameraTarget, setCameraTarget] = useState(null);

    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    const moveToNode = (node) => {
        setCameraTarget({
            x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0
        });
    };

    const fetchNearby = (currentPos) => {
        axios.get('http://localhost:8080/api/v1/nodes/viz', {
            params: { x: currentPos.x, y: currentPos.y, z: currentPos.z, range: 1000 }
        }).then(res => {
            const serverNodes = res.data.data || [];
            setNodes(prev => {
                const map = new Map(prev.filter(n => new THREE.Vector3(n.x, n.y, n.z).distanceTo(currentPos) < 2500).map(n => [n.id, n]));
                serverNodes.forEach(n => map.set(n.id, n));
                return Array.from(map.values());
            });
        });
    };

    useEffect(() => {
        fetchNearby(new THREE.Vector3(0, 0, 30));
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-mutr'),
            onConnect: () => {
                client.subscribe('/topic/galaxy/public', (msg) => {
                    const newNode = JSON.parse(msg.body);
                    setNodes(prev => [...prev.filter(n => n.id !== newNode.id), newNode]);
                });
            }
        });
        client.activate();
        return () => client.deactivate();
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <KeyboardControls map={[
                { name: 'forward', keys: ['w', 'W'] },
                { name: 'backward', keys: ['s', 'S'] },
                { name: 'left', keys: ['a', 'A'] },
                { name: 'right', keys: ['d', 'D'] },
            ]}>
                <Canvas gl={{ alpha: true, antialias: true }} onPointerMissed={() => setSelectedNodeId(null)}>
                    <CameraController 
                        cameraTarget={cameraTarget} 
                        setCameraTarget={setCameraTarget} 
                        setCamera={setMainCamera} 
                    />
                    
                    <ambientLight intensity={0.7} />
                    
                    {/* 중단 신호가 오면 cameraTarget을 비움 */}
                    <Movement onInterrupt={() => setCameraTarget(null)} />
                    
                    <SceneController onMoveThreshold={fetchNearby} />
                    <RelationLines nodes={nodes} selectedNodeId={selectedNodeId} />
                    {nodes.map(node => (
                        <Star key={node.id} node={node} isSelected={node.id === selectedNodeId} 
                              onSelect={setSelectedNodeId} onDoubleClick={moveToNode} />
                    ))}
                </Canvas>
            </KeyboardControls>

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