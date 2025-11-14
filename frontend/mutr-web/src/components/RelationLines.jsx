import React, { useMemo, useRef } from 'react';
import { QuadraticBezierLine } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * RelationLines: 선택된 노드를 중심으로 부모와 자식 간의 관계를 곡선으로 연결하고 흐름 애니메이션을 표현하는 컴포넌트
 */
export default function RelationLines({ nodes, selectedNodeId }) {
  // 생성된 라인 객체들의 애니메이션 제어를 위한 레퍼런스 배열
  const lineRefs = useRef([]);

  /**
   * treeLinks: 선택된 노드로부터 파생되는 전체 계층 구조(조상 및 후손)를 계산하여 연결선 데이터를 생성
   */
  const treeLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    const links = [];
    const visited = new Set(); // 중복 연결 방지를 위한 셋

    /**
     * addLink: 부모와 자식 노드의 좌표를 바탕으로 베지어 곡선 데이터를 생성하여 links 배열에 추가
     */
    const addLink = (pid, cid) => {
      const key = `${pid}-${cid}`;
      if (visited.has(key)) return;
      
      const p = nodes.find(n => String(n.id) === String(pid));
      const c = nodes.find(n => String(n.id) === String(cid));
      
      if (p && c) {
        // 시작점(부모)과 끝점(자식) 좌표 설정
        const start = [p.x ?? 0, p.y ?? 0, p.z ?? 0];
        const end = [c.x ?? 0, c.y ?? 0, c.z ?? 0];
        
        // 곡선 효과를 위해 시작점과 끝점의 중간 상단에 제어점(mid) 배치
        const mid = [(start[0]+end[0])/2, (start[1]+end[1])/2 + 8, (start[2]+end[2])/2];
        
        links.push({ id: key, start, end, mid });
        visited.add(key);
      }
    };

    // 1. findD (Descendants): 선택된 노드로부터 모든 자식/후손 방향으로 재귀 탐색
    const findD = (id) => nodes.filter(n => String(n.parentId) === String(id)).forEach(c => { 
      addLink(id, c.id); 
      findD(c.id); 
    });

    // 2. findA (Ancestors): 선택된 노드로부터 루트 노드까지 부모 방향으로 재귀 탐색
    const findA = (id) => { 
      const curr = nodes.find(n => String(n.id) === String(id)); 
      if (curr?.parentId) { 
        addLink(curr.parentId, id); 
        findA(curr.parentId); 
      } 
    };
    
    findD(selectedNodeId);
    findA(selectedNodeId);
    return links;
  }, [nodes, selectedNodeId]);

  /**
   * 매 프레임마다 호출되어 라인의 점선 오프셋(dashOffset)을 조절함으로써 부모에서 자식으로 흐르는 애니메이션 구현
   */
  useFrame(() => {
    lineRefs.current.forEach(line => {
      if (line?.material) {
        // 점선의 오프셋을 줄여서 데이터가 흐르는 듯한 시각적 효과 생성
        line.material.dashOffset -= 0.04;
      }
    });
  });

  // 렌더링 시마다 레퍼런스 배열을 비워 이전 프레임의 참조 제거
  lineRefs.current = [];

  return (
    <group>
      {treeLinks.map((link) => (
        <QuadraticBezierLine
          key={link.id}
          ref={el => { if(el) lineRefs.current.push(el) }} // 각 라인 객체를 레퍼런스 배열에 수집
          start={link.start}
          end={link.end}
          mid={link.mid}
          color="#5b7bb1"   // 라인 색상 설정
          lineWidth={4}     // 선 굵기
          dashed            // 점선 효과 활성화
          dashScale={3}     // 점선 간격 스케일
          transparent
          opacity={0.8}     // 투명도 설정
        />
      ))}
    </group>
  );
}