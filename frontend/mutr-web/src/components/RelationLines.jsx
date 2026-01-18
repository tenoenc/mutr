/* src/components/RelationLines.jsx */
import React, { useMemo, useRef } from 'react';
import { QuadraticBezierLine } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function RelationLines({ nodes, selectedNodeId }) {
  const lineRefs = useRef([]);

  const treeLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    const links = [];
    const visited = new Set();

    const addLink = (pid, cid) => {
      const key = `${pid}-${cid}`;
      if (visited.has(key)) return;
      const p = nodes.find(n => String(n.id) === String(pid));
      const c = nodes.find(n => String(n.id) === String(cid));
      
      if (p && c) {
        // ✅ 방향성: p(부모)가 start, c(자식)가 end
        const start = [p.x ?? 0, p.y ?? 0, p.z ?? 0];
        const end = [c.x ?? 0, c.y ?? 0, c.z ?? 0];
        const mid = [(start[0]+end[0])/2, (start[1]+end[1])/2 + 8, (start[2]+end[2])/2];
        links.push({ id: key, start, end, mid });
        visited.add(key);
      }
    };

    const findD = (id) => nodes.filter(n => String(n.parentId) === String(id)).forEach(c => { addLink(id, c.id); findD(c.id); });
    const findA = (id) => { const curr = nodes.find(n => String(n.id) === String(id)); if (curr?.parentId) { addLink(curr.parentId, id); findA(curr.parentId); } };
    
    findD(selectedNodeId);
    findA(selectedNodeId);
    return links;
  }, [nodes, selectedNodeId]);

  // ✅ 중요: 매 프레임 실행되는 애니메이션 로직
  useFrame(() => {
    lineRefs.current.forEach(line => {
      if (line?.material) {
        // 음수 방향으로 일정하게 감소하여 부모->자식 흐름 생성
        line.material.dashOffset -= 0.04;
      }
    });
  });

  // ✅ 렌더링 시 레퍼런스 배열을 초기화하여 속도 중첩 방지
  lineRefs.current = [];

  return (
    <group>
      {treeLinks.map((link) => (
        <QuadraticBezierLine
          key={link.id}
          ref={el => { if(el) lineRefs.current.push(el) }}
          start={link.start}
          end={link.end}
          mid={link.mid}
          color="#5b7bb1"
          lineWidth={4}
          dashed
          dashScale={3}
          transparent
          opacity={0.8}
        />
      ))}
    </group>
  );
}