import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Edges, Line } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';

// Generates arc points for 2D door swing visuals in blueprint mode
function getArcPoints(cx, cz, radius, startAngleDeg, endAngleDeg, segments = 32) {
  const points = [];
  const startRad = (startAngleDeg * Math.PI) / 180;
  const endRad = (endAngleDeg * Math.PI) / 180;
  const step = (endRad - startRad) / segments;

  for (let i = 0; i <= segments; i++) {
    const angle = startRad + step * i;
    points.push(new THREE.Vector3(
      cx + radius * Math.cos(angle),
      0.02, // slightly above the ground
      cz + radius * Math.sin(angle)
    ));
  }
  return points;
}

// Generates contiguous segments for shared wall splitting
function getSegments(minVal, maxVal, overlaps) {
  overlaps.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of overlaps) {
    if (merged.length === 0) {
      merged.push([interval[0], interval[1]]);
    } else {
      const last = merged[merged.length - 1];
      if (interval[0] <= last[1] + 0.1) {
        last[1] = Math.max(last[1], interval[1]);
      } else {
        merged.push([interval[0], interval[1]]);
      }
    }
  }
  
  const segments = [];
  let current = minVal;
  for (const interval of merged) {
    if (interval[0] > current + 0.1) {
      segments.push({ start: current, end: interval[0], isShared: false });
    }
    segments.push({ start: Math.max(minVal, interval[0]), end: Math.min(maxVal, interval[1]), isShared: true });
    current = interval[1];
  }
  if (current < maxVal - 0.1) {
    segments.push({ start: current, end: maxVal, isShared: false });
  }
  return segments;
}

// Returns wall segments split by intersections with all other rooms
function getWallSegmentsForRoom(room, allRooms) {
  const x = room.x;
  const y = room.y;
  const w = room.width || room.w;
  const h = room.height || room.h;

  const topOverlaps = [];
  const bottomOverlaps = [];
  const leftOverlaps = [];
  const rightOverlaps = [];

  for (const other of allRooms) {
    if (other.id === room.id) continue;
    const ox = other.x;
    const oy = other.y;
    const ow = other.width || other.w;
    const oh = other.height || other.h;
    
    // Top wall overlap
    if (Math.abs((oy + oh) - y) < 0.1) {
      const overlapStart = Math.max(x, ox);
      const overlapEnd = Math.min(x + w, ox + ow);
      if (overlapEnd > overlapStart + 0.1) {
        topOverlaps.push([overlapStart, overlapEnd]);
      }
    }
    // Bottom wall overlap
    if (Math.abs(oy - (y + h)) < 0.1) {
      const overlapStart = Math.max(x, ox);
      const overlapEnd = Math.min(x + w, ox + ow);
      if (overlapEnd > overlapStart + 0.1) {
        bottomOverlaps.push([overlapStart, overlapEnd]);
      }
    }
    // Left wall overlap
    if (Math.abs((ox + ow) - x) < 0.1) {
      const overlapStart = Math.max(y, oy);
      const overlapEnd = Math.min(y + h, oy + oh);
      if (overlapEnd > overlapStart + 0.1) {
        leftOverlaps.push([overlapStart, overlapEnd]);
      }
    }
    // Right wall overlap
    if (Math.abs(ox - (x + w)) < 0.1) {
      const overlapStart = Math.max(y, oy);
      const overlapEnd = Math.min(y + h, oy + oh);
      if (overlapEnd > overlapStart + 0.1) {
        rightOverlaps.push([overlapStart, overlapEnd]);
      }
    }
  }

  return {
    top: getSegments(x, x + w, topOverlaps),
    bottom: getSegments(x, x + w, bottomOverlaps),
    left: getSegments(y, y + h, leftOverlaps),
    right: getSegments(y, y + h, rightOverlaps)
  };
}

// 1. Solid Wall Segment Mesh
function SolidWallSegment({ globalStyle, xStart, xEnd, thickness, roomHeight, color, isSelected, blueprintMode, wireframeMode, onClick }) {
  const length = xEnd - xStart;
  if (length <= 0.001) return null;

  const position = [xStart + length / 2, roomHeight / 2, thickness / 2];

  if (blueprintMode) {
    return (
      <mesh position={position} onClick={onClick}>
        <boxGeometry args={[length, roomHeight, thickness]} />
        <meshBasicMaterial color="#1a2f4c" transparent opacity={0.85} />
        <Edges scale={1} threshold={15} color={isSelected ? "#ec4899" : "#ffffff"} />
      </mesh>
    );
  }

  return (
    <mesh position={position} castShadow receiveShadow onClick={onClick}>
      <boxGeometry args={[length, roomHeight, thickness]} />
      <meshStandardMaterial 
        color={globalStyle === 'Traditional Indian' ? "#e6bca5" : (globalStyle === 'Royal/Heritage' ? "#fdfbf7" : color)} 
        roughness={globalStyle === 'Traditional Indian' ? 0.8 : (globalStyle === 'Royal/Heritage' ? 0.1 : 0.4)} 
        metalness={globalStyle === 'Royal/Heritage' ? 0.3 : 0.1} 
        transparent 
        opacity={wireframeMode ? 0.3 : 1.0}
        wireframe={wireframeMode}
      />
      <Edges scale={1} threshold={15} color={isSelected ? "#ec4899" : "#444455"} />
    </mesh>
  );
}

// 2. Window Segment with Sill, Header, Frame and Glazing
function WindowSegment({ globalStyle, xStart, xEnd, thickness, roomHeight, color, isSelected, blueprintMode, wireframeMode, onClick }) {
  const wColor = globalStyle === 'Traditional Indian' ? "#e6bca5" : (globalStyle === 'Royal/Heritage' ? "#fdfbf7" : color);
  const wRough = globalStyle === 'Traditional Indian' ? 0.8 : (globalStyle === 'Royal/Heritage' ? 0.1 : 0.4);
  const wMetal = globalStyle === 'Royal/Heritage' ? 0.3 : 0.1;
  const fColor = globalStyle === 'Traditional Indian' ? "#5d4037" : (globalStyle === 'Royal/Heritage' ? "#b8860b" : "#ffffff");
  const fRough = globalStyle === 'Royal/Heritage' ? 0.2 : 0.8;
  const fMetal = globalStyle === 'Royal/Heritage' ? 0.8 : 0.1;
  const length = xEnd - xStart;
  if (length <= 0.001) return null;

  const sillHeight = 0.4;
  const windowTop = 1.0;
  const frameThickness = 0.04;

  if (blueprintMode) {
    // 2D Glazing lines in blueprint mode
    const midY = 0.02;
    const offset = thickness * 0.25;
    return (
      <group onClick={onClick}>
        {/* Wall capping end lines */}
        <Line 
          points={[
            new THREE.Vector3(xStart, midY, 0),
            new THREE.Vector3(xStart, midY, thickness)
          ]}
          color="#4ecdc4"
          lineWidth={1.5}
        />
        <Line 
          points={[
            new THREE.Vector3(xEnd, midY, 0),
            new THREE.Vector3(xEnd, midY, thickness)
          ]}
          color="#4ecdc4"
          lineWidth={1.5}
        />
        {/* Double glazing lines */}
        <Line 
          points={[
            new THREE.Vector3(xStart, midY, offset),
            new THREE.Vector3(xEnd, midY, offset)
          ]}
          color="#4ecdc4"
          lineWidth={1}
        />
        <Line 
          points={[
            new THREE.Vector3(xStart, midY, thickness - offset),
            new THREE.Vector3(xEnd, midY, thickness - offset)
          ]}
          color="#4ecdc4"
          lineWidth={1}
        />
      </group>
    );
  }

  return (
    <group position={[xStart, 0, 0]} onClick={onClick}>
      {/* 1. Sill Wall (Bottom) */}
      <mesh position={[length / 2, sillHeight / 2, thickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[length, sillHeight, thickness]} />
        <meshStandardMaterial color={wColor} roughness={wRough} metalness={wMetal} transparent opacity={wireframeMode ? 0.3 : 1.0} wireframe={wireframeMode} />
        <Edges scale={1} threshold={15} color={isSelected ? "#ec4899" : "#444455"} />
      </mesh>

      {/* 2. Header Wall (Top) */}
      <mesh position={[length / 2, windowTop + (roomHeight - windowTop) / 2, thickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[length, roomHeight - windowTop, thickness]} />
        <meshStandardMaterial color={wColor} roughness={wRough} metalness={wMetal} transparent opacity={wireframeMode ? 0.3 : 1.0} wireframe={wireframeMode} />
        <Edges scale={1} threshold={15} color={isSelected ? "#ec4899" : "#444455"} />
      </mesh>

      {/* 3. Window Glass (Translucent Blue) */}
      {!wireframeMode && (
        <mesh position={[length / 2, sillHeight + (windowTop - sillHeight) / 2, thickness / 2]}>
          <boxGeometry args={[length - 0.05, windowTop - sillHeight - 0.05, 0.02]} />
          <meshStandardMaterial color="#80d8ff" transparent opacity={0.4} roughness={0.1} metalness={0.9} />
        </mesh>
      )}

      {/* 4. Window Frame (uPVC White) */}
      {!wireframeMode && (
        <group position={[length / 2, sillHeight + (windowTop - sillHeight) / 2, thickness / 2]}>
          {/* Bottom frame border */}
          <mesh position={[0, -(windowTop - sillHeight) / 2 + frameThickness / 2, 0]}>
            <boxGeometry args={[length, frameThickness, thickness + 0.01]} />
            <meshStandardMaterial color={fColor} roughness={fRough} metalness={fMetal} />
          </mesh>
          {/* Top frame border */}
          <mesh position={[0, (windowTop - sillHeight) / 2 - frameThickness / 2, 0]}>
            <boxGeometry args={[length, frameThickness, thickness + 0.01]} />
            <meshStandardMaterial color={fColor} roughness={fRough} metalness={fMetal} />
          </mesh>
          {/* Left frame border */}
          <mesh position={[-length / 2 + frameThickness / 2, 0, 0]}>
            <boxGeometry args={[frameThickness, windowTop - sillHeight, thickness + 0.01]} />
            <meshStandardMaterial color={fColor} roughness={fRough} metalness={fMetal} />
          </mesh>
          {/* Right frame border */}
          <mesh position={[length / 2 - frameThickness / 2, 0, 0]}>
            <boxGeometry args={[frameThickness, windowTop - sillHeight, thickness + 0.01]} />
            <meshStandardMaterial color={fColor} roughness={fRough} metalness={fMetal} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 3. Door Segment with Open swing 3D wood and 2D swing arc
function DoorSegment({ globalStyle, wallName, xStart, xEnd, thickness, roomHeight, color, isSelected, blueprintMode, wireframeMode, onClick }) {
  const fColor = globalStyle === 'Traditional Indian' ? "#3e2723" : (globalStyle === 'Royal/Heritage' ? "#b8860b" : "#8d6e63");
  const fRough = globalStyle === 'Royal/Heritage' ? 0.2 : 0.6;
  const fMetal = globalStyle === 'Royal/Heritage' ? 0.8 : 0.1;
  const dColor = globalStyle === 'Traditional Indian' ? "#4e342e" : (globalStyle === 'Royal/Heritage' ? "#e5c100" : "#5d4037");
  const dRough = globalStyle === 'Royal/Heritage' ? 0.3 : 0.8;
  const dMetal = globalStyle === 'Royal/Heritage' ? 0.7 : 0.1;
  const length = xEnd - xStart;
  if (length <= 0.001) return null;

  const frameThickness = 0.05;

  if (blueprintMode) {
    // 2D Swing Arc & Panel in Blueprint view
    const midY = 0.02;
    let arcPoints = [];
    let doorLinePoints = [];

    // Pivot is at xStart. Calculate arc depending on wall orientation
    if (wallName === 'front') {
      arcPoints = getArcPoints(xStart, thickness, length, 0, 90);
      doorLinePoints = [
        new THREE.Vector3(xStart, midY, thickness),
        new THREE.Vector3(xStart, midY, thickness + length)
      ];
    } else if (wallName === 'back') {
      arcPoints = getArcPoints(xStart, 0, length, 270, 360);
      doorLinePoints = [
        new THREE.Vector3(xStart, midY, 0),
        new THREE.Vector3(xStart, midY, -length)
      ];
    } else if (wallName === 'left') {
      arcPoints = getArcPoints(xStart, 0, length, 90, 180);
      doorLinePoints = [
        new THREE.Vector3(xStart, midY, 0),
        new THREE.Vector3(xStart - length, midY, 0)
      ];
    } else if (wallName === 'right') {
      arcPoints = getArcPoints(xStart, thickness, length, 0, 90);
      doorLinePoints = [
        new THREE.Vector3(xStart, midY, thickness),
        new THREE.Vector3(xStart + length, midY, thickness)
      ];
    }

    return (
      <group onClick={onClick}>
        {/* Door Capping line */}
        <Line 
          points={[
            new THREE.Vector3(xStart, midY, 0),
            new THREE.Vector3(xStart, midY, thickness)
          ]}
          color="#38bdf8"
          lineWidth={1.5}
        />
        <Line 
          points={[
            new THREE.Vector3(xEnd, midY, 0),
            new THREE.Vector3(xEnd, midY, thickness)
          ]}
          color="#38bdf8"
          lineWidth={1.5}
        />
        {/* Open Door slab */}
        {doorLinePoints.length > 0 && (
          <Line points={doorLinePoints} color="#38bdf8" lineWidth={2} />
        )}
        {/* Radial swing arc */}
        {arcPoints.length > 0 && (
          <Line points={arcPoints} color="#38bdf8" lineWidth={1} dashed dashSize={0.1} gapSize={0.08} />
        )}
      </group>
    );
  }

  // 3D Door segment: Frame borders and slightly open Wood Door slab (45 degrees)
  return (
    <group position={[xStart, 0, 0]} onClick={onClick}>
      {/* Header Frame (Top horizontal bar) */}
      <mesh position={[length / 2, roomHeight - frameThickness / 2, thickness / 2]} castShadow>
        <boxGeometry args={[length, frameThickness, thickness + 0.01]} />
        <meshStandardMaterial color={fColor} roughness={fRough} metalness={fMetal} />
      </mesh>
      {/* Left Frame vertical bar */}
      <mesh position={[frameThickness / 2, roomHeight / 2, thickness / 2]} castShadow>
        <boxGeometry args={[frameThickness, roomHeight, thickness + 0.01]} />
        <meshStandardMaterial color={fColor} roughness={fRough} metalness={fMetal} />
      </mesh>
      {/* Right Frame vertical bar */}
      <mesh position={[length - frameThickness / 2, roomHeight / 2, thickness / 2]} castShadow>
        <boxGeometry args={[frameThickness, roomHeight, thickness + 0.01]} />
        <meshStandardMaterial color={fColor} roughness={fRough} metalness={fMetal} />
      </mesh>

      {/* Door panel itself (Hinged at left side frame, rotated 45 deg INWARDS) */}
      {!wireframeMode && (
        <group position={[frameThickness, 0, thickness / 2]} rotation={[0, Math.PI / 4, 0]}>
          <mesh position={[(length - frameThickness * 2) / 2, (roomHeight - frameThickness) / 2, 0]} castShadow>
            <boxGeometry args={[length - frameThickness * 2, roomHeight - frameThickness, 0.03]} />
            <meshStandardMaterial color={dColor} roughness={dRough} metalness={dMetal} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// 4. Group Wall Assembler (coordinates outer, inner, and openings offsets)
function ArchitecturalWall({ globalStyle, wallName, length, thickness, roomHeight, openings, color, isSelected, blueprintMode, wireframeMode, onClick, onAddOpening, placeMode }) {
  const wallOpenings = openings.filter(o => o.wall === wallName);

  const handleClick = (e) => {
    if (e) e.stopPropagation();
    if (placeMode !== 'select' && onAddOpening) {
      onAddOpening();
    } else if (onClick) {
      onClick(e);
    }
  };

  if (wallOpenings.length === 0) {
    return (
      <SolidWallSegment 
        xStart={0} 
        xEnd={length} 
        thickness={thickness} 
        roomHeight={roomHeight} 
        color={color} 
        globalStyle={globalStyle}
        isSelected={isSelected} 
        blueprintMode={blueprintMode} 
        wireframeMode={wireframeMode}
        onClick={handleClick} 
      />
    );
  }

  const sorted = [...wallOpenings].sort((a, b) => a.offset - b.offset);
  const segments = [];
  let lastX = 0;

  sorted.forEach((op, idx) => {
    // Solid segment before opening
    if (op.offset > lastX) {
      segments.push(
        <SolidWallSegment 
          key={`wall-${idx}-pre`}
          xStart={lastX} 
          xEnd={op.offset} 
          thickness={thickness} 
          roomHeight={roomHeight} 
          color={color} 
          globalStyle={globalStyle}
          isSelected={isSelected} 
          blueprintMode={blueprintMode} 
          wireframeMode={wireframeMode}
          onClick={handleClick} 
        />
      );
    }

    // Opening segment
    if (op.type === 'window') {
      segments.push(
        <WindowSegment 
          key={`win-${idx}`}
          xStart={op.offset} 
          xEnd={op.offset + op.width} 
          thickness={thickness} 
          roomHeight={roomHeight} 
          color={color} 
          globalStyle={globalStyle}
          isSelected={isSelected} 
          blueprintMode={blueprintMode} 
          wireframeMode={wireframeMode}
          onClick={handleClick} 
        />
      );
    } else if (op.type === 'door') {
      segments.push(
        <DoorSegment 
          key={`door-${idx}`}
          wallName={wallName}
          xStart={op.offset} 
          xEnd={op.offset + op.width} 
          thickness={thickness} 
          roomHeight={roomHeight} 
          color={color} 
          globalStyle={globalStyle}
          isSelected={isSelected} 
          blueprintMode={blueprintMode} 
          wireframeMode={wireframeMode}
          onClick={handleClick} 
        />
      );
    }

    lastX = op.offset + op.width;
  });

  // Remaining segment after last opening
  if (length > lastX) {
    segments.push(
      <SolidWallSegment 
        key={`wall-post`}
        xStart={lastX} 
        xEnd={length} 
        thickness={thickness} 
        roomHeight={roomHeight} 
        color={color} 
        globalStyle={globalStyle}
        isSelected={isSelected} 
        blueprintMode={blueprintMode} 
        wireframeMode={wireframeMode}
        onClick={handleClick} 
      />
    );
  }

  return <group>{segments}</group>;
}

// ==========================================
// 2D AUTOCAD-STYLE BLUEPRINT ROOM RENDERER
// ==========================================

function BlueprintDoorSymbol({ wall, offset, opW, h, w, t }) {
  const midY = 0.02;
  let arcPoints = [];
  let doorLinePoints = [];
  let frameLines = [];

  if (wall === 'back') {
    arcPoints = getArcPoints(offset, 0, opW, 0, 90);
    doorLinePoints = [
      new THREE.Vector3(offset, midY, 0),
      new THREE.Vector3(offset, midY, opW)
    ];
    frameLines = [
      [new THREE.Vector3(offset, midY, -0.02), new THREE.Vector3(offset, midY, t + 0.02)],
      [new THREE.Vector3(offset + opW, midY, -0.02), new THREE.Vector3(offset + opW, midY, t + 0.02)]
    ];
  } else if (wall === 'front') {
    arcPoints = getArcPoints(offset, h, opW, 270, 360);
    doorLinePoints = [
      new THREE.Vector3(offset, midY, h),
      new THREE.Vector3(offset, midY, h - opW)
    ];
    frameLines = [
      [new THREE.Vector3(offset, midY, h - t - 0.02), new THREE.Vector3(offset, midY, h + 0.02)],
      [new THREE.Vector3(offset + opW, midY, h - t - 0.02), new THREE.Vector3(offset + opW, midY, h + 0.02)]
    ];
  } else if (wall === 'left') {
    arcPoints = getArcPoints(0, offset, opW, 0, 90);
    doorLinePoints = [
      new THREE.Vector3(0, midY, offset),
      new THREE.Vector3(opW, midY, offset)
    ];
    frameLines = [
      [new THREE.Vector3(-0.02, midY, offset), new THREE.Vector3(t + 0.02, midY, offset)],
      [new THREE.Vector3(-0.02, midY, offset + opW), new THREE.Vector3(t + 0.02, midY, offset + opW)]
    ];
  } else if (wall === 'right') {
    arcPoints = getArcPoints(w, offset, opW, 90, 180);
    doorLinePoints = [
      new THREE.Vector3(w, midY, offset),
      new THREE.Vector3(w - opW, midY, offset)
    ];
    frameLines = [
      [new THREE.Vector3(w - t - 0.02, midY, offset), new THREE.Vector3(w + 0.02, midY, offset)],
      [new THREE.Vector3(w - t - 0.02, midY, offset + opW), new THREE.Vector3(w + 0.02, midY, offset + opW)]
    ];
  }

  return (
    <group>
      {frameLines.map((fl, i) => (
        <Line key={i} points={fl} color="#eab308" lineWidth={1.5} />
      ))}
      {doorLinePoints.length > 0 && (
        <Line points={doorLinePoints} color="#ec4899" lineWidth={2} />
      )}
      {arcPoints.length > 0 && (
        <Line points={arcPoints} color="#fbcfe8" lineWidth={1} dashed dashSize={0.08} gapSize={0.06} />
      )}
    </group>
  );
}

function BlueprintWindowSymbol({ wall, offset, opW, h, w, t }) {
  const midY = 0.02;
  let lines = [];

  if (wall === 'back') {
    const centerZ = t / 2;
    lines = [
      [new THREE.Vector3(offset, midY, centerZ - 0.06), new THREE.Vector3(offset + opW, midY, centerZ - 0.06)],
      [new THREE.Vector3(offset, midY, centerZ + 0.06), new THREE.Vector3(offset + opW, midY, centerZ + 0.06)],
      [new THREE.Vector3(offset, midY, centerZ - 0.02), new THREE.Vector3(offset + opW, midY, centerZ - 0.02)],
      [new THREE.Vector3(offset, midY, centerZ + 0.02), new THREE.Vector3(offset + opW, midY, centerZ + 0.02)],
      [new THREE.Vector3(offset, midY, centerZ - 0.06), new THREE.Vector3(offset, midY, centerZ + 0.06)],
      [new THREE.Vector3(offset + opW, midY, centerZ - 0.06), new THREE.Vector3(offset + opW, midY, centerZ + 0.06)]
    ];
  } else if (wall === 'front') {
    const centerZ = h - t / 2;
    lines = [
      [new THREE.Vector3(offset, midY, centerZ - 0.06), new THREE.Vector3(offset + opW, midY, centerZ - 0.06)],
      [new THREE.Vector3(offset, midY, centerZ + 0.06), new THREE.Vector3(offset + opW, midY, centerZ + 0.06)],
      [new THREE.Vector3(offset, midY, centerZ - 0.02), new THREE.Vector3(offset + opW, midY, centerZ - 0.02)],
      [new THREE.Vector3(offset, midY, centerZ + 0.02), new THREE.Vector3(offset + opW, midY, centerZ + 0.02)],
      [new THREE.Vector3(offset, midY, centerZ - 0.06), new THREE.Vector3(offset, midY, centerZ + 0.06)],
      [new THREE.Vector3(offset + opW, midY, centerZ - 0.06), new THREE.Vector3(offset + opW, midY, centerZ + 0.06)]
    ];
  } else if (wall === 'left') {
    const centerX = t / 2;
    lines = [
      [new THREE.Vector3(centerX - 0.06, midY, offset), new THREE.Vector3(centerX - 0.06, midY, offset + opW)],
      [new THREE.Vector3(centerX + 0.06, midY, offset), new THREE.Vector3(centerX + 0.06, midY, offset + opW)],
      [new THREE.Vector3(centerX - 0.02, midY, offset), new THREE.Vector3(centerX - 0.02, midY, offset + opW)],
      [new THREE.Vector3(centerX + 0.02, midY, offset), new THREE.Vector3(centerX + 0.02, midY, offset + opW)],
      [new THREE.Vector3(centerX - 0.06, midY, offset), new THREE.Vector3(centerX + 0.06, midY, offset)],
      [new THREE.Vector3(centerX - 0.06, midY, offset + opW), new THREE.Vector3(centerX + 0.06, midY, offset + opW)]
    ];
  } else if (wall === 'right') {
    const centerX = w - t / 2;
    lines = [
      [new THREE.Vector3(centerX - 0.06, midY, offset), new THREE.Vector3(centerX - 0.06, midY, offset + opW)],
      [new THREE.Vector3(centerX + 0.06, midY, offset), new THREE.Vector3(centerX + 0.06, midY, offset + opW)],
      [new THREE.Vector3(centerX - 0.02, midY, offset), new THREE.Vector3(centerX - 0.02, midY, offset + opW)],
      [new THREE.Vector3(centerX + 0.02, midY, offset), new THREE.Vector3(centerX + 0.02, midY, offset + opW)],
      [new THREE.Vector3(centerX - 0.06, midY, offset), new THREE.Vector3(centerX + 0.06, midY, offset)],
      [new THREE.Vector3(centerX - 0.06, midY, offset + opW), new THREE.Vector3(centerX + 0.06, midY, offset + opW)]
    ];
  }

  return (
    <group>
      {lines.map((l, i) => (
        <Line key={i} points={l} color="#4ecdc4" lineWidth={1.5} />
      ))}
    </group>
  );
}

function BlueprintRoom({
  data,
  isSelected,
  onSelect,
  activeFloor,
  allRooms,
  structureLayer,
  furnitureLayer,
  electricalLayer,
  plumbingLayer,
  unit,
  onHover,
  placeMode,
  onAddOpening
}) {
  const w = data.width || data.w || 0;
  const h = data.height || data.h || 0;
  const { x, y, color, name, floor = 0 } = data;
  const verticalOffset = floor * 1.6;
  const t = name.toLowerCase().includes('hall') || name.toLowerCase().includes('living') ? 0.23 : 0.15;
  const isWetRoom = name.toLowerCase().includes('toilet') || name.toLowerCase().includes('bath') || name.toLowerCase().includes('kitchen');

  const walls = useMemo(() => getWallSegmentsForRoom(data, allRooms || []), [data, allRooms]);

  const openings = useMemo(() => {
    return data.openings || [
      { type: 'door', wall: 'front', offset: 0.5, width: 0.9 },
      { type: 'window', wall: 'back', offset: Math.max(0.5, w / 2 - 0.6), width: Math.min(w - 1.0, 1.2) }
    ];
  }, [data.openings, w]);

  const formattedDimensions = unit === 'ft'
    ? `${(w * 3.28084).toFixed(1)}' × ${(h * 3.28084).toFixed(1)}'`
    : `${w.toFixed(1)}m × ${h.toFixed(1)}m`;

  return (
    <group position={[x - 5, verticalOffset + 0.01, y - 5]}>
      {/* 1. FLOOR BASE */}
      {structureLayer && (
        <mesh 
          position={[w / 2, 0.005, h / 2]} 
          onClick={onSelect}
          onPointerOver={(e) => { e.stopPropagation(); if (onHover) onHover(data); }}
          onPointerOut={() => { if (onHover) onHover(null); }}
        >
          <boxGeometry args={[w, 0.002, h]} />
          <meshBasicMaterial color="#0c1726" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      )}

      {/* 2. ADJACENCY-AWARE WALLS */}
      {structureLayer && (
        <group>
          {/* Back Wall */}
          {walls.top.map((seg, idx) => {
            const xStart = seg.start - x;
            const xEnd = seg.end - x;
            if (seg.isShared) {
              return (
                <Line 
                  key={`back-sh-${idx}`}
                  points={[new THREE.Vector3(xStart, 0.012, 0), new THREE.Vector3(xEnd, 0.012, 0)]}
                  color="#ec4899"
                  lineWidth={1.2}
                  dashed
                  dashSize={0.1}
                  gapSize={0.08}
                />
              );
            } else {
              return (
                <group key={`back-ext-${idx}`}>
                  <Line 
                    points={[new THREE.Vector3(xStart, 0.012, 0), new THREE.Vector3(xEnd, 0.012, 0)]}
                    color="#ec4899"
                    lineWidth={2.5}
                  />
                  <Line 
                    points={[
                      new THREE.Vector3(xStart + (xStart === 0 ? t : 0), 0.012, t),
                      new THREE.Vector3(xEnd - (xEnd === w ? t : 0), 0.012, t)
                    ]}
                    color="rgba(236, 72, 153, 0.45)"
                    lineWidth={1}
                  />
                </group>
              );
            }
          })}

          {/* Front Wall */}
          {walls.bottom.map((seg, idx) => {
            const xStart = seg.start - x;
            const xEnd = seg.end - x;
            if (seg.isShared) {
              return (
                <Line 
                  key={`front-sh-${idx}`}
                  points={[new THREE.Vector3(xStart, 0.012, h), new THREE.Vector3(xEnd, 0.012, h)]}
                  color="#ec4899"
                  lineWidth={1.2}
                  dashed
                  dashSize={0.1}
                  gapSize={0.08}
                />
              );
            } else {
              return (
                <group key={`front-ext-${idx}`}>
                  <Line 
                    points={[new THREE.Vector3(xStart, 0.012, h), new THREE.Vector3(xEnd, 0.012, h)]}
                    color="#ec4899"
                    lineWidth={2.5}
                  />
                  <Line 
                    points={[
                      new THREE.Vector3(xStart + (xStart === 0 ? t : 0), 0.012, h - t),
                      new THREE.Vector3(xEnd - (xEnd === w ? t : 0), 0.012, h - t)
                    ]}
                    color="rgba(236, 72, 153, 0.45)"
                    lineWidth={1}
                  />
                </group>
              );
            }
          })}

          {/* Left Wall */}
          {walls.left.map((seg, idx) => {
            const zStart = seg.start - y;
            const zEnd = seg.end - y;
            if (seg.isShared) {
              return (
                <Line 
                  key={`left-sh-${idx}`}
                  points={[new THREE.Vector3(0, 0.012, zStart), new THREE.Vector3(0, 0.012, zEnd)]}
                  color="#ec4899"
                  lineWidth={1.2}
                  dashed
                  dashSize={0.1}
                  gapSize={0.08}
                />
              );
            } else {
              return (
                <group key={`left-ext-${idx}`}>
                  <Line 
                    points={[new THREE.Vector3(0, 0.012, zStart), new THREE.Vector3(0, 0.012, zEnd)]}
                    color="#ec4899"
                    lineWidth={2.5}
                  />
                  <Line 
                    points={[
                      new THREE.Vector3(t, 0.012, zStart + (zStart === 0 ? t : 0)),
                      new THREE.Vector3(t, 0.012, zEnd - (zEnd === h ? t : 0))
                    ]}
                    color="rgba(236, 72, 153, 0.45)"
                    lineWidth={1}
                  />
                </group>
              );
            }
          })}

          {/* Right Wall */}
          {walls.right.map((seg, idx) => {
            const zStart = seg.start - y;
            const zEnd = seg.end - y;
            if (seg.isShared) {
              return (
                <Line 
                  key={`right-sh-${idx}`}
                  points={[new THREE.Vector3(w, 0.012, zStart), new THREE.Vector3(w, 0.012, zEnd)]}
                  color="#ec4899"
                  lineWidth={1.2}
                  dashed
                  dashSize={0.1}
                  gapSize={0.08}
                />
              );
            } else {
              return (
                <group key={`right-ext-${idx}`}>
                  <Line 
                    points={[new THREE.Vector3(w, 0.012, zStart), new THREE.Vector3(w, 0.012, zEnd)]}
                    color="#ec4899"
                    lineWidth={2.5}
                  />
                  <Line 
                    points={[
                      new THREE.Vector3(w - t, 0.012, zStart + (zStart === 0 ? t : 0)),
                      new THREE.Vector3(w - t, 0.012, zEnd - (zEnd === h ? t : 0))
                    ]}
                    color="rgba(236, 72, 153, 0.45)"
                    lineWidth={1}
                  />
                </group>
              );
            }
          })}
        </group>
      )}

      {/* 3. WINDOWS & DOORS WITH MASKING PLANES */}
      {structureLayer && openings.map((op, idx) => {
        const { type, wall, offset, width: opW } = op;
        let maskPos = [0, 0.015, 0];
        let maskSize = [0, 0];
        
        if (wall === 'back') {
          maskPos = [offset + opW / 2, 0.015, t / 2];
          maskSize = [opW, t + 0.04];
        } else if (wall === 'front') {
          maskPos = [offset + opW / 2, 0.015, h - t / 2];
          maskSize = [opW, t + 0.04];
        } else if (wall === 'left') {
          maskPos = [t / 2, 0.015, offset + opW / 2];
          maskSize = [t + 0.04, opW];
        } else if (wall === 'right') {
          maskPos = [w - t / 2, 0.015, offset + opW / 2];
          maskSize = [t + 0.04, opW];
        }

        return (
          <group key={`opening-${idx}`} onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect();
          }}>
            <mesh position={maskPos} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={maskSize} />
              <meshBasicMaterial color="#0c1a30" depthWrite={true} />
            </mesh>

            {type === 'door' ? (
              <BlueprintDoorSymbol wall={wall} offset={offset} opW={opW} h={h} w={w} t={t} />
            ) : (
              <BlueprintWindowSymbol wall={wall} offset={offset} opW={opW} h={h} w={w} t={t} />
            )}
          </group>
        );
      })}

      {/* 4. HIGH-FIDELITY VECTOR FURNITURE SYMBOLS */}
      {furnitureLayer && (
        <group>
          {/* Bedroom */}
          {(name.toLowerCase().includes('bed') || name.toLowerCase().includes('suite') || name.toLowerCase().includes('kids')) && (
            <group>
              <Line points={[
                new THREE.Vector3(w * 0.2, 0.02, h * 0.2),
                new THREE.Vector3(w * 0.8, 0.02, h * 0.2),
                new THREE.Vector3(w * 0.8, 0.02, h * 0.8),
                new THREE.Vector3(w * 0.2, 0.02, h * 0.8),
                new THREE.Vector3(w * 0.2, 0.02, h * 0.2)
              ]} color="#ec4899" lineWidth={1.5} />
              <Line points={[
                new THREE.Vector3(w * 0.25, 0.02, h * 0.23),
                new THREE.Vector3(w * 0.47, 0.02, h * 0.23),
                new THREE.Vector3(w * 0.47, 0.02, h * 0.38),
                new THREE.Vector3(w * 0.25, 0.02, h * 0.38),
                new THREE.Vector3(w * 0.25, 0.02, h * 0.23)
              ]} color="#fbcfe8" lineWidth={1} />
              <Line points={[
                new THREE.Vector3(w * 0.53, 0.02, h * 0.23),
                new THREE.Vector3(w * 0.75, 0.02, h * 0.23),
                new THREE.Vector3(w * 0.75, 0.02, h * 0.38),
                new THREE.Vector3(w * 0.53, 0.02, h * 0.38),
                new THREE.Vector3(w * 0.53, 0.02, h * 0.23)
              ]} color="#fbcfe8" lineWidth={1} />
              <Line points={[
                new THREE.Vector3(w * 0.2, 0.02, h * 0.5),
                new THREE.Vector3(w * 0.8, 0.02, h * 0.5)
              ]} color="#fbcfe8" lineWidth={1.2} />
              <Line points={[
                new THREE.Vector3(w * 0.2, 0.02, h * 0.54),
                new THREE.Vector3(w * 0.8, 0.02, h * 0.54)
              ]} color="#fbcfe8" lineWidth={1} dashed dashSize={0.05} gapSize={0.05} />
              {/* Nightstands */}
              <Line points={[
                new THREE.Vector3(w * 0.06, 0.02, h * 0.2),
                new THREE.Vector3(w * 0.16, 0.02, h * 0.2),
                new THREE.Vector3(w * 0.16, 0.02, h * 0.32),
                new THREE.Vector3(w * 0.06, 0.02, h * 0.32),
                new THREE.Vector3(w * 0.06, 0.02, h * 0.2)
              ]} color="#ec4899" lineWidth={1} />
              <Line points={[
                new THREE.Vector3(w * 0.84, 0.02, h * 0.2),
                new THREE.Vector3(w * 0.94, 0.02, h * 0.2),
                new THREE.Vector3(w * 0.94, 0.02, h * 0.32),
                new THREE.Vector3(w * 0.84, 0.02, h * 0.32),
                new THREE.Vector3(w * 0.84, 0.02, h * 0.2)
              ]} color="#ec4899" lineWidth={1} />
              {/* Nightstand Lamps */}
              <Line points={getArcPoints(w * 0.11, h * 0.26, 0.03, 0, 360)} color="#ffd700" lineWidth={1} />
              <Line points={getArcPoints(w * 0.89, h * 0.26, 0.03, 0, 360)} color="#ffd700" lineWidth={1} />
            </group>
          )}

          {/* Living / Hall / Lounge / Foyer */}
          {(name.toLowerCase().includes('living') || name.toLowerCase().includes('hall') || name.toLowerCase().includes('lounge') || name.toLowerCase().includes('foyer')) && (
            <group>
              <Line points={[
                new THREE.Vector3(w * 0.15, 0.02, h * 0.15),
                new THREE.Vector3(w * 0.85, 0.02, h * 0.15),
                new THREE.Vector3(w * 0.85, 0.02, h * 0.5),
                new THREE.Vector3(w * 0.72, 0.02, h * 0.5),
                new THREE.Vector3(w * 0.72, 0.02, h * 0.28),
                new THREE.Vector3(w * 0.15, 0.02, h * 0.28),
                new THREE.Vector3(w * 0.15, 0.02, h * 0.15)
              ]} color="#ec4899" lineWidth={1.5} />
              <Line points={[new THREE.Vector3(w * 0.32, 0.02, h * 0.15), new THREE.Vector3(w * 0.32, 0.02, h * 0.28)]} color="#fbcfe8" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.52, 0.02, h * 0.15), new THREE.Vector3(w * 0.52, 0.02, h * 0.28)]} color="#fbcfe8" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.72, 0.02, h * 0.15), new THREE.Vector3(w * 0.72, 0.02, h * 0.28)]} color="#fbcfe8" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.72, 0.02, h * 0.38), new THREE.Vector3(w * 0.85, 0.02, h * 0.38)]} color="#fbcfe8" lineWidth={1} />
              
              {/* Coffee table */}
              <Line points={[
                new THREE.Vector3(w * 0.35, 0.02, h * 0.5),
                new THREE.Vector3(w * 0.65, 0.02, h * 0.5),
                new THREE.Vector3(w * 0.65, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.35, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.35, 0.02, h * 0.5)
              ]} color="#ec4899" lineWidth={1.2} />
              <Line points={[
                new THREE.Vector3(w * 0.38, 0.02, h * 0.53),
                new THREE.Vector3(w * 0.62, 0.02, h * 0.53),
                new THREE.Vector3(w * 0.62, 0.02, h * 0.69),
                new THREE.Vector3(w * 0.38, 0.02, h * 0.69),
                new THREE.Vector3(w * 0.38, 0.02, h * 0.53)
              ]} color="rgba(255,255,255,0.15)" lineWidth={1} />
            </group>
          )}

          {/* Kitchen */}
          {name.toLowerCase().includes('kitchen') && (
            <group>
              <Line points={[
                new THREE.Vector3(t, 0.02, t),
                new THREE.Vector3(w - t, 0.02, t),
                new THREE.Vector3(w - t, 0.02, h - t)
              ]} color="#ec4899" lineWidth={1.5} />
              <Line points={[
                new THREE.Vector3(t, 0.02, t + 0.6),
                new THREE.Vector3(w - t - 0.6, 0.02, t + 0.6),
                new THREE.Vector3(w - t - 0.6, 0.02, h - t)
              ]} color="#ec4899" lineWidth={1.2} />

              {/* Stove Hob */}
              <Line points={[
                new THREE.Vector3(w * 0.22, 0.02, t + 0.1),
                new THREE.Vector3(w * 0.45, 0.02, t + 0.1),
                new THREE.Vector3(w * 0.45, 0.02, t + 0.5),
                new THREE.Vector3(w * 0.22, 0.02, t + 0.5),
                new THREE.Vector3(w * 0.22, 0.02, t + 0.1)
              ]} color="#ec4899" lineWidth={1.2} />
              {/* Burners */}
              <Line points={getArcPoints(w * 0.29, t + 0.3, 0.08, 0, 360)} color="#ffffff" lineWidth={1.2} />
              <Line points={getArcPoints(w * 0.29, t + 0.3, 0.03, 0, 360)} color="#ffffff" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.29 - 0.1, 0.02, t + 0.3), new THREE.Vector3(w * 0.29 + 0.1, 0.02, t + 0.3)]} color="#ffffff" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.29, 0.02, t + 0.3 - 0.1), new THREE.Vector3(w * 0.29, 0.02, t + 0.3 + 0.1)]} color="#ffffff" lineWidth={1} />
              
              <Line points={getArcPoints(w * 0.38, t + 0.3, 0.08, 0, 360)} color="#ffffff" lineWidth={1.2} />
              <Line points={getArcPoints(w * 0.38, t + 0.3, 0.03, 0, 360)} color="#ffffff" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.38 - 0.1, 0.02, t + 0.3), new THREE.Vector3(w * 0.38 + 0.1, 0.02, t + 0.3)]} color="#ffffff" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.38, 0.02, t + 0.3 - 0.1), new THREE.Vector3(w * 0.38, 0.02, t + 0.3 + 0.1)]} color="#ffffff" lineWidth={1} />

              {/* Double Bowl Sink */}
              <Line points={[
                new THREE.Vector3(w - t - 0.5, 0.02, h * 0.3),
                new THREE.Vector3(w - t - 0.1, 0.02, h * 0.3),
                new THREE.Vector3(w - t - 0.1, 0.02, h * 0.6),
                new THREE.Vector3(w - t - 0.5, 0.02, h * 0.6),
                new THREE.Vector3(w - t - 0.5, 0.02, h * 0.3)
              ]} color="#ec4899" lineWidth={1.2} />
              <Line points={[
                new THREE.Vector3(w - t - 0.47, 0.02, h * 0.32),
                new THREE.Vector3(w - t - 0.31, 0.02, h * 0.32),
                new THREE.Vector3(w - t - 0.31, 0.02, h * 0.58),
                new THREE.Vector3(w - t - 0.47, 0.02, h * 0.58),
                new THREE.Vector3(w - t - 0.47, 0.02, h * 0.32)
              ]} color="#ffffff" lineWidth={1} />
              <Line points={[
                new THREE.Vector3(w - t - 0.29, 0.02, h * 0.32),
                new THREE.Vector3(w - t - 0.13, 0.02, h * 0.32),
                new THREE.Vector3(w - t - 0.13, 0.02, h * 0.58),
                new THREE.Vector3(w - t - 0.29, 0.02, h * 0.58),
                new THREE.Vector3(w - t - 0.29, 0.02, h * 0.32)
              ]} color="#ffffff" lineWidth={1} />
              <Line points={getArcPoints(w - t - 0.39, h * 0.45, 0.015, 0, 360)} color="#ffffff" lineWidth={1} />
              <Line points={getArcPoints(w - t - 0.21, h * 0.45, 0.015, 0, 360)} color="#ffffff" lineWidth={1} />
              {/* Faucet */}
              <Line points={[new THREE.Vector3(w - t - 0.3, 0.02, h * 0.22), new THREE.Vector3(w - t - 0.3, 0.02, h * 0.3)]} color="#ffffff" lineWidth={1.5} />
            </group>
          )}

          {/* Bathroom / Toilet */}
          {(name.toLowerCase().includes('bath') || name.toLowerCase().includes('toilet') || name.toLowerCase().includes('powder')) && (
            <group>
              {/* Shower Cabin with Diagonal Cross-hairs */}
              <Line points={[
                new THREE.Vector3(t, 0.02, h - t),
                new THREE.Vector3(t + 0.9, 0.02, h - t),
                new THREE.Vector3(t + 0.9, 0.02, h - t - 0.9),
                new THREE.Vector3(t, 0.02, h - t - 0.9),
                new THREE.Vector3(t, 0.02, h - t)
              ]} color="#ec4899" lineWidth={1.5} />
              <Line points={[new THREE.Vector3(t, 0.02, h - t), new THREE.Vector3(t + 0.9, 0.02, h - t - 0.9)]} color="rgba(255,255,255,0.2)" lineWidth={1} />
              <Line points={[new THREE.Vector3(t + 0.9, 0.02, h - t), new THREE.Vector3(t, 0.02, h - t - 0.9)]} color="rgba(255,255,255,0.2)" lineWidth={1} />
              <Line points={getArcPoints(t + 0.45, h - t - 0.45, 0.03, 0, 360)} color="#ffffff" lineWidth={1} />

              {/* Toilet Commode */}
              <Line points={[
                new THREE.Vector3(w - t - 0.22, 0.02, h * 0.25),
                new THREE.Vector3(w - t, 0.02, h * 0.25),
                new THREE.Vector3(w - t, 0.02, h * 0.45),
                new THREE.Vector3(w - t - 0.22, 0.02, h * 0.45),
                new THREE.Vector3(w - t - 0.22, 0.02, h * 0.25)
              ]} color="#ec4899" lineWidth={1.2} />
              <Line points={getArcPoints(w - t - 0.4, h * 0.35, 0.16, 0, 360)} color="#ec4899" lineWidth={1.2} />
              <Line points={getArcPoints(w - t - 0.36, h * 0.35, 0.12, 0, 360)} color="#ffffff" lineWidth={1} />

              {/* Washbasin */}
              <Line points={[
                new THREE.Vector3(w * 0.2, 0.02, t),
                new THREE.Vector3(w * 0.45, 0.02, t),
                new THREE.Vector3(w * 0.45, 0.02, t + 0.38),
                new THREE.Vector3(w * 0.2, 0.02, t + 0.38),
                new THREE.Vector3(w * 0.2, 0.02, t)
              ]} color="#ec4899" lineWidth={1.2} />
              <Line points={getArcPoints(w * 0.325, t + 0.19, 0.12, 0, 360)} color="#ffffff" lineWidth={1} />
              <Line points={[new THREE.Vector3(w * 0.325, 0.02, t), new THREE.Vector3(w * 0.325, 0.02, t + 0.08)]} color="#ffffff" lineWidth={1.5} />
            </group>
          )}

          {/* Pooja */}
          {name.toLowerCase().includes('pooja') && (
            <group>
              <Line points={getArcPoints(w * 0.5, h * 0.5, Math.min(w, h) * 0.35, 0, 360)} color="#ec4899" lineWidth={1.5} />
              <Line points={getArcPoints(w * 0.5, h * 0.5, Math.min(w, h) * 0.25, 0, 360)} color="#fbcfe8" lineWidth={1} dashed dashSize={0.04} gapSize={0.04} />
              <Line points={[
                new THREE.Vector3(w * 0.5, 0.02, h * 0.18),
                new THREE.Vector3(w * 0.72, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.18, 0.02, h * 0.5),
                new THREE.Vector3(w * 0.82, 0.02, h * 0.5),
                new THREE.Vector3(w * 0.28, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.5, 0.02, h * 0.18)
              ]} color="#ffd700" lineWidth={1.2} />
              <Line points={getArcPoints(w * 0.5, h * 0.5, 0.06, 0, 360)} color="#ffd700" lineWidth={1.5} />
            </group>
          )}

          {/* Dining */}
          {name.toLowerCase().includes('dining') && (
            <group>
              <Line points={[
                new THREE.Vector3(w * 0.28, 0.02, h * 0.3),
                new THREE.Vector3(w * 0.72, 0.02, h * 0.3),
                new THREE.Vector3(w * 0.72, 0.02, h * 0.7),
                new THREE.Vector3(w * 0.28, 0.02, h * 0.7),
                new THREE.Vector3(w * 0.28, 0.02, h * 0.3)
              ]} color="#ec4899" lineWidth={1.5} />
              <Line points={[
                new THREE.Vector3(w * 0.3, 0.02, h * 0.32),
                new THREE.Vector3(w * 0.7, 0.02, h * 0.32),
                new THREE.Vector3(w * 0.7, 0.02, h * 0.68),
                new THREE.Vector3(w * 0.3, 0.02, h * 0.68),
                new THREE.Vector3(w * 0.3, 0.02, h * 0.32)
              ]} color="rgba(255,255,255,0.15)" lineWidth={1} />
              {/* Chairs */}
              <Line points={[
                new THREE.Vector3(w * 0.38, 0.02, h * 0.18),
                new THREE.Vector3(w * 0.46, 0.02, h * 0.18),
                new THREE.Vector3(w * 0.46, 0.02, h * 0.28),
                new THREE.Vector3(w * 0.38, 0.02, h * 0.28),
                new THREE.Vector3(w * 0.38, 0.02, h * 0.18)
              ]} color="#fbcfe8" lineWidth={1.2} />
              <Line points={[
                new THREE.Vector3(w * 0.54, 0.02, h * 0.18),
                new THREE.Vector3(w * 0.62, 0.02, h * 0.18),
                new THREE.Vector3(w * 0.62, 0.02, h * 0.28),
                new THREE.Vector3(w * 0.54, 0.02, h * 0.28),
                new THREE.Vector3(w * 0.54, 0.02, h * 0.18)
              ]} color="#fbcfe8" lineWidth={1.2} />
              <Line points={[
                new THREE.Vector3(w * 0.38, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.46, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.46, 0.02, h * 0.82),
                new THREE.Vector3(w * 0.38, 0.02, h * 0.82),
                new THREE.Vector3(w * 0.38, 0.02, h * 0.72)
              ]} color="#fbcfe8" lineWidth={1.2} />
              <Line points={[
                new THREE.Vector3(w * 0.54, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.62, 0.02, h * 0.72),
                new THREE.Vector3(w * 0.62, 0.02, h * 0.82),
                new THREE.Vector3(w * 0.54, 0.02, h * 0.82),
                new THREE.Vector3(w * 0.54, 0.02, h * 0.72)
              ]} color="#fbcfe8" lineWidth={1.2} />
            </group>
          )}

          {/* Brahmasthan */}
          {name.toLowerCase().includes('brahmasthan') && (
            <group>
              <Line points={getArcPoints(w * 0.5, h * 0.5, w * 0.36, 0, 360)} color="#ffd700" lineWidth={1.2} dashed dashSize={0.06} gapSize={0.06} />
              <Line points={getArcPoints(w * 0.5, h * 0.5, w * 0.12, 0, 360)} color="#ffd700" lineWidth={1.5} />
              <Line points={[new THREE.Vector3(w * 0.5, 0.02, h * 0.14), new THREE.Vector3(w * 0.5, 0.02, h * 0.86)]} color="#ffd700" lineWidth={1} dashed dashSize={0.04} gapSize={0.04} />
              <Line points={[new THREE.Vector3(w * 0.14, 0.02, h * 0.5), new THREE.Vector3(w * 0.86, 0.02, h * 0.5)]} color="#ffd700" lineWidth={1} dashed dashSize={0.04} gapSize={0.04} />
            </group>
          )}
        </group>
      )}

      {/* 5. ELECTRICAL LAYER */}
      {electricalLayer && (
        <group>
          <Line points={getArcPoints(w / 2, h / 2, 0.15, 0, 360)} color="#fbbf24" lineWidth={1.5} />
          <Line 
            points={[
              new THREE.Vector3(w / 2 - 0.4, 0.022, h / 2),
              new THREE.Vector3(w / 2 + 0.4, 0.022, h / 2)
            ]}
            color="#fbbf24"
            lineWidth={1.5}
          />
          <Line 
            points={[
              new THREE.Vector3(w / 2, 0.022, h / 2 - 0.4),
              new THREE.Vector3(w / 2, 0.022, h / 2 + 0.4)
            ]}
            color="#fbbf24"
            lineWidth={1.5}
          />
          <Line points={[
            new THREE.Vector3(t + 0.02, 0.022, h / 2 - 0.1),
            new THREE.Vector3(t + 0.12, 0.022, h / 2 - 0.1),
            new THREE.Vector3(t + 0.12, 0.022, h / 2 + 0.1),
            new THREE.Vector3(t + 0.02, 0.022, h / 2 + 0.1),
            new THREE.Vector3(t + 0.02, 0.022, h / 2 - 0.1)
          ]} color="#fcd34d" lineWidth={1.2} />
          <Html position={[t + 0.07, 0.05, h / 2]} center>
            <div style={{ color: '#fcd34d', fontSize: '8px', fontWeight: 'bold', fontFamily: 'monospace' }}>S</div>
          </Html>
          <Line 
            points={[
              new THREE.Vector3(t + 0.12, 0.022, h / 2),
              new THREE.Vector3(w / 2, 0.022, h / 2)
            ]}
            color="#fbbf24"
            lineWidth={1}
            dashed
            dashSize={0.08}
            gapSize={0.08}
          />
        </group>
      )}

      {/* 6. PLUMBING LAYER */}
      {plumbingLayer && isWetRoom && (
        <group>
          {(name.toLowerCase().includes('toilet') || name.toLowerCase().includes('bath')) ? (
            <group>
              <Line 
                points={[
                  new THREE.Vector3(w * 0.325, 0.022, t),
                  new THREE.Vector3(w * 0.325, 0.022, h * 0.35),
                  new THREE.Vector3(w - t - 0.4, 0.022, h * 0.35)
                ]}
                color="#0ea5e9"
                lineWidth={2}
              />
              <Line 
                points={[
                  new THREE.Vector3(t + 0.45, 0.022, h - t - 0.45),
                  new THREE.Vector3(t + 0.45, 0.022, h - t),
                  new THREE.Vector3(0, 0.022, h - t)
                ]}
                color="#f97316"
                lineWidth={1.5}
                dashed
                dashSize={0.1}
                gapSize={0.06}
              />
            </group>
          ) : (
            <group>
              <Line 
                points={[
                  new THREE.Vector3(w - t - 0.3, 0.022, h * 0.22),
                  new THREE.Vector3(w - t - 0.3, 0.022, 0)
                ]}
                color="#0ea5e9"
                lineWidth={2.5}
              />
              <Line 
                points={[
                  new THREE.Vector3(w - t - 0.3, 0.022, h * 0.45),
                  new THREE.Vector3(w, 0.022, h * 0.45)
                ]}
                color="#f97316"
                lineWidth={1.5}
                dashed
                dashSize={0.1}
                gapSize={0.06}
              />
            </group>
          )}
        </group>
      )}

      {/* 7. DIMENSION LINES */}
      <group>
        <Line 
          points={[
            new THREE.Vector3(0, 0.02, -0.4),
            new THREE.Vector3(w, 0.02, -0.4)
          ]}
          color="#eab308"
          lineWidth={1.2}
        />
        <Line points={[new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0.02, -0.45)]} color="#eab308" lineWidth={0.5} />
        <Line points={[new THREE.Vector3(w, 0.02, 0), new THREE.Vector3(w, 0.02, -0.45)]} color="#eab308" lineWidth={0.5} />
        <Html position={[w / 2, 0.1, -0.45]} center>
          <div style={{ background: '#111827', border: '1px solid #eab308', padding: '1px 4px', color: '#eab308', fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {unit === 'ft' ? `${(w * 3.28084).toFixed(1)}'` : `${w.toFixed(2)}m`}
          </div>
        </Html>

        <Line 
          points={[
            new THREE.Vector3(-0.4, 0.02, 0),
            new THREE.Vector3(-0.4, 0.02, h)
          ]}
          color="#eab308"
          lineWidth={1.2}
        />
        <Line points={[new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(-0.45, 0.02, 0)]} color="#eab308" lineWidth={0.5} />
        <Line points={[new THREE.Vector3(0, 0.02, h), new THREE.Vector3(-0.45, 0.02, h)]} color="#eab308" lineWidth={0.5} />
        <Html position={[-0.45, 0.1, h / 2]} center>
          <div style={{ background: '#111827', border: '1px solid #eab308', padding: '1px 4px', color: '#eab308', fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {unit === 'ft' ? `${(h * 3.28084).toFixed(1)}'` : `${h.toFixed(2)}m`}
          </div>
        </Html>
      </group>

      {/* 8. ROOM LABELS */}
      <Html position={[w / 2, 0.15, h / 2]} center>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          style={{ 
            color: 'white', 
            fontSize: '10px', 
            fontWeight: '700', 
            letterSpacing: '0.5px', 
            cursor: 'pointer',
            textShadow: '0px 2px 4px rgba(0,0,0,0.9)', 
            whiteSpace: 'nowrap',
            background: isSelected ? '#ec4899' : 'rgba(11, 26, 48, 0.9)',
            border: isSelected ? '1px solid #ebd3f8' : '1px solid #4ecdc4',
            boxShadow: isSelected ? '0 0 10px rgba(236, 72, 153, 0.5)' : 'none',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.2s ease'
          }}
        >
          {name}
        </div>
      </Html>

      {isSelected && (
        <Html position={[w / 2, 0.4, h / 2]} center>
          <div 
            style={{
              background: 'rgba(236, 72, 153, 0.95)',
              border: '1px solid #ebd3f8',
              boxShadow: '0 0 15px rgba(236, 72, 153, 0.6)',
              borderRadius: '6px',
              padding: '3px 8px',
              color: 'white',
              fontSize: '10px',
              fontWeight: '800',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            📏 {formattedDimensions}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// GLOBAL DOOR SYNCHRONIZATION ALGORITHM
// Pre-computes openings for ALL rooms at once so that shared walls get
// matching holes on both sides, eliminating ghost gaps / blocked doorways.
// ============================================================================
function generateGlobalOpenings(allRooms) {
  if (!allRooms || allRooms.length === 0) return {};

  const result = {}; // { roomId: [ {type, wall, offset, width}, ... ] }
  for (const r of allRooms) result[r.id] = [];

  // 1. Build adjacency graph — find which rooms share a wall
  const adjacency = []; // [{roomA, roomB, wallA, wallB, overlapStart, overlapEnd, overlapLen}]
  for (let i = 0; i < allRooms.length; i++) {
    const a = allRooms[i];
    const ax = a.x, ay = a.y, aw = a.width || a.w, ah = a.height || a.h;
    for (let j = i + 1; j < allRooms.length; j++) {
      const b = allRooms[j];
      const bx = b.x, by = b.y, bw = b.width || b.w, bh = b.height || b.h;

      // A's bottom touches B's top  =>  A.front = B.back
      if (Math.abs((ay + ah) - by) < 0.15) {
        const os = Math.max(ax, bx), oe = Math.min(ax + aw, bx + bw);
        if (oe - os > 0.8) adjacency.push({ a, b, wallA: 'front', wallB: 'back', axis: 'x', os, oe, len: oe - os });
      }
      // A's top touches B's bottom  =>  A.back = B.front
      if (Math.abs(ay - (by + bh)) < 0.15) {
        const os = Math.max(ax, bx), oe = Math.min(ax + aw, bx + bw);
        if (oe - os > 0.8) adjacency.push({ a, b, wallA: 'back', wallB: 'front', axis: 'x', os, oe, len: oe - os });
      }
      // A's right touches B's left  =>  A.right = B.left
      if (Math.abs((ax + aw) - bx) < 0.15) {
        const os = Math.max(ay, by), oe = Math.min(ay + ah, by + bh);
        if (oe - os > 0.8) adjacency.push({ a, b, wallA: 'right', wallB: 'left', axis: 'y', os, oe, len: oe - os });
      }
      // A's left touches B's right  =>  A.left = B.right
      if (Math.abs(ax - (bx + bw)) < 0.15) {
        const os = Math.max(ay, by), oe = Math.min(ay + ah, by + bh);
        if (oe - os > 0.8) adjacency.push({ a, b, wallA: 'left', wallB: 'right', axis: 'y', os, oe, len: oe - os });
      }
    }
  }

  // 2. Find the "main" room (Living Room / Corridor / Hall) — BFS root
  const mainRoom = allRooms.find(r => {
    const n = (r.name || '').toLowerCase();
    return n.includes('living') || n.includes('corridor') || n.includes('hall') || n.includes('foyer');
  }) || allRooms[0];

  // 3. BFS to connect every room via internal doors
  const visited = new Set();
  const queue = [mainRoom.id];
  visited.add(mainRoom.id);

  while (queue.length > 0) {
    const currentId = queue.shift();
    // Find all adjacencies involving this room
    for (const edge of adjacency) {
      let neighbor, wallCurrent, wallNeighbor, axisRef, overlapStart, overlapEnd;
      if (edge.a.id === currentId && !visited.has(edge.b.id)) {
        neighbor = edge.b; wallCurrent = edge.wallA; wallNeighbor = edge.wallB;
        axisRef = edge.axis; overlapStart = edge.os; overlapEnd = edge.oe;
      } else if (edge.b.id === currentId && !visited.has(edge.a.id)) {
        neighbor = edge.a; wallCurrent = edge.wallB; wallNeighbor = edge.wallA;
        axisRef = edge.axis; overlapStart = edge.os; overlapEnd = edge.oe;
      } else {
        continue;
      }

      visited.add(neighbor.id);
      queue.push(neighbor.id);

      // Calculate door placement in local coordinates for each room
      const doorWidth = 0.9;
      const overlapMid = (overlapStart + overlapEnd) / 2;

      const currentRoom = allRooms.find(r => r.id === currentId);
      const cBaseX = currentRoom.x, cBaseY = currentRoom.y;
      const nBaseX = neighbor.x, nBaseY = neighbor.y;

      let offsetCurrent, offsetNeighbor;
      if (axisRef === 'x') {
        // horizontal wall — offset is along X
        offsetCurrent = overlapMid - cBaseX - doorWidth / 2;
        offsetNeighbor = overlapMid - nBaseX - doorWidth / 2;
      } else {
        // vertical wall — offset is along Y
        offsetCurrent = overlapMid - cBaseY - doorWidth / 2;
        offsetNeighbor = overlapMid - nBaseY - doorWidth / 2;
      }

      // Clamp offsets to valid range
      const cDim = axisRef === 'x' ? (currentRoom.width || currentRoom.w) : (currentRoom.height || currentRoom.h);
      const nDim = axisRef === 'x' ? (neighbor.width || neighbor.w) : (neighbor.height || neighbor.h);
      offsetCurrent = Math.max(0.15, Math.min(offsetCurrent, cDim - doorWidth - 0.15));
      offsetNeighbor = Math.max(0.15, Math.min(offsetNeighbor, nDim - doorWidth - 0.15));

      // Push matching door to BOTH rooms
      result[currentId].push({ type: 'door', wall: wallCurrent, offset: offsetCurrent, width: doorWidth });
      result[neighbor.id].push({ type: 'door', wall: wallNeighbor, offset: offsetNeighbor, width: doorWidth });
    }
  }

  // 4. Main entry door on an exterior wall of the main room
  const mainRoomData = allRooms.find(r => r.id === mainRoom.id);
  const mx = mainRoomData.x, my = mainRoomData.y;
  const mw = mainRoomData.width || mainRoomData.w, mh = mainRoomData.height || mainRoomData.h;

  // Find which walls of the main room are NOT shared (exterior)
  const sharedWalls = new Set();
  for (const edge of adjacency) {
    if (edge.a.id === mainRoom.id) sharedWalls.add(edge.wallA);
    if (edge.b.id === mainRoom.id) sharedWalls.add(edge.wallB);
  }
  const exteriorPref = ['front', 'left', 'back', 'right'];
  const entryWall = exteriorPref.find(w => !sharedWalls.has(w)) || 'front';
  const entryDim = (entryWall === 'front' || entryWall === 'back') ? mw : mh;
  const entryOffset = Math.max(0.2, entryDim / 2 - 0.6);
  result[mainRoom.id].push({ type: 'door', wall: entryWall, offset: entryOffset, width: 1.2 });

  // 5. Windows on exterior walls for every room
  for (const room of allRooms) {
    const rx = room.x, ry = room.y;
    const rw = room.width || room.w, rh = room.height || room.h;
    const roomShared = new Set();
    for (const edge of adjacency) {
      if (edge.a.id === room.id) roomShared.add(edge.wallA);
      if (edge.b.id === room.id) roomShared.add(edge.wallB);
    }
    // Place a window on the first available exterior wall that doesn't already have a door
    const wallOrder = ['back', 'right', 'front', 'left'];
    for (const wn of wallOrder) {
      if (roomShared.has(wn)) continue; // skip shared/internal walls
      const dim = (wn === 'front' || wn === 'back') ? rw : rh;
      if (dim < 1.2) continue; // wall too short for a window
      // Check if a door is already on this wall
      const hasDoor = result[room.id].some(o => o.wall === wn && o.type === 'door');
      const winWidth = Math.min(dim - 0.6, 1.2);
      const winOffset = hasDoor ? Math.max(0.2, dim - winWidth - 0.3) : Math.max(0.2, dim / 2 - winWidth / 2);
      result[room.id].push({ type: 'window', wall: wn, offset: winOffset, width: winWidth });
      break; // one window per room is enough as a default
    }
  }

  return result;
}

// Room Renderer combining slab floor, layers overlays, and surrounding architectural walls
function Room({ 
  data, 
  isSelected, 
  onSelect, 
  wireframeMode, 
  activeFloor, 
  blueprintMode,
  electricalLayer,
  plumbingLayer,
  structureLayer = true,
  furnitureLayer = true,
  unit = 'm',
  onHover,
  placeMode,
  onAddOpening,
  allRooms,
  globalStyle,
  globalOpenings
}) {
  const { width, height, x, y, color, name, floor = 0 } = data;
  if (width < 0.2 || height < 0.2) return null;

  if (blueprintMode) {
    return (
      <BlueprintRoom
        data={data}
        allRooms={allRooms}
        isSelected={isSelected}
        onSelect={onSelect}
        activeFloor={activeFloor}
        electricalLayer={electricalLayer}
        plumbingLayer={plumbingLayer}
        structureLayer={structureLayer}
        furnitureLayer={furnitureLayer}
        unit={unit}
        onHover={onHover}
        placeMode={placeMode}
        onAddOpening={onAddOpening}
      />
    );
  }

  const roomHeight = 1.2;
  const floorHeight = 1.6;
  const verticalOffset = floor * floorHeight;
  
  // Outer external brick thickness (230mm) or Partition internal (150mm)
  const isWetRoom = name.toLowerCase().includes('toilet') || name.toLowerCase().includes('bath') || name.toLowerCase().includes('kitchen');
  const t = 0.2; 

  const isAllVisible = activeFloor === 'all' || activeFloor === undefined || activeFloor === null;
  const isFloorActive = isAllVisible || floor === activeFloor;
  
  // Calculate wall segments for adjacency awareness
  const walls = useMemo(() => getWallSegmentsForRoom(data, allRooms || []), [data, allRooms]);

  // Use globally synchronized openings (doors + windows pre-computed for all rooms)
  // This ensures shared walls get matching holes on BOTH sides — no ghost gaps.
  const openings = useMemo(() => {
    // If user/AI explicitly set openings on this room, honour them
    if (data.openings) return data.openings;
    // Otherwise use the global algorithm's output
    if (globalOpenings && globalOpenings[data.id]) return globalOpenings[data.id];
    // Absolute fallback
    return [{ type: 'door', wall: 'front', offset: 0.5, width: 0.9 }];
  }, [data.openings, data.id, globalOpenings]);

  if (!isFloorActive) {
    // Isolated outlines for unselected floor level stacks
    return (
      <group position={[x - 5, verticalOffset + 0.01, y - 5]}>
        <mesh position={[width / 2, roomHeight / 2, height / 2]}>
          <boxGeometry args={[width, roomHeight, height]} />
          <meshBasicMaterial color={color} transparent opacity={0.02} depthWrite={false} />
          <Edges scale={1} threshold={15} color={color} />
        </mesh>
      </group>
    );
  }

  // Label display values based on active metric/imperial units
  const formattedDimensions = unit === 'ft'
    ? `${(width * 3.28084).toFixed(1)}' × ${(height * 3.28084).toFixed(1)}'`
    : `${width.toFixed(1)}m × ${height.toFixed(1)}m`;

  return (
    <group position={[x - 5, verticalOffset + 0.01, y - 5]}>
      
      {/* A. FLOOR SLAB / BASEMENT (LAYER: STRUCTURE) */}
      {structureLayer && (
        blueprintMode ? (
          // In Blueprint Mode, draw thin shaded base
          <mesh 
            position={[width / 2, 0.005, height / 2]} 
            onClick={onSelect}
            onPointerOver={(e) => { e.stopPropagation(); if (onHover) onHover(data); }}
            onPointerOut={() => { if (onHover) onHover(null); }}
          >
            <boxGeometry args={[width, 0.01, height]} />
            <meshBasicMaterial color="#0c1726" transparent opacity={0.4} />
            <Edges scale={1} threshold={15} color="#1d3557" />
          </mesh>
        ) : (
          // 3D Realistic Wood/Marble Floor Slab
          <mesh 
            position={[width / 2, 0.005, height / 2]} 
            receiveShadow 
            onClick={onSelect}
            onPointerOver={(e) => { e.stopPropagation(); if (onHover) onHover(data); }}
            onPointerOut={() => { if (onHover) onHover(null); }}
          >
            <boxGeometry args={[width, 0.01, height]} />
            <meshStandardMaterial 
              color={isWetRoom ? "#cfd8dc" : (globalStyle === 'Traditional Indian' ? "#8c564b" : (globalStyle === 'Royal/Heritage' ? "#fdfbf7" : "#a1887f"))} 
              roughness={globalStyle === 'Royal/Heritage' ? 0.1 : 0.3} 
              metalness={globalStyle === 'Royal/Heritage' ? 0.5 : 0.0} 
              transparent 
              opacity={wireframeMode ? 0.3 : 1.0}
            />
            <Edges scale={1} threshold={15} color={isSelected ? "#ec4899" : "#5d4037"} />
          </mesh>
        )
      )}

      {/* B. ARCHITECTURAL WALL SECTIONS (LAYER: STRUCTURE) */}
      {structureLayer && (
        <group>
          {/* 1. Back Wall segments */}
          {walls.top.map((seg, idx) => {
            const xStart = seg.start - x;
            const xEnd = seg.end - x;
            const segLength = xEnd - xStart;
            if (segLength <= 0.05) return null;

            // Render all wall segments to prevent gaps and jagged edges
            // (Rooms will render adjacent inner walls forming a clean union)

            return (
              <group key={`back-seg-${idx}`} position={[xStart, 0, 0]} rotation={[0, 0, 0]}>
                <ArchitecturalWall 
                  globalStyle={globalStyle}
                  wallName="back" 
                  length={segLength} 
                  thickness={t} 
                  roomHeight={roomHeight} 
                  openings={openings.map(o => ({...o, offset: o.offset - xStart})).filter(o => o.wall === 'back' && o.offset >= 0 && o.offset + o.width <= segLength)} 
                  color={color} 
                  isSelected={isSelected} 
                  blueprintMode={blueprintMode} 
                  wireframeMode={wireframeMode}
                  onClick={onSelect}
                  onAddOpening={placeMode !== 'select' ? () => onAddOpening('back') : undefined}
                  placeMode={placeMode}
                />
              </group>
            );
          })}

          {/* 2. Front Wall segments */}
          {walls.bottom.map((seg, idx) => {
            const xStart = seg.start - x;
            const xEnd = seg.end - x;
            const segLength = xEnd - xStart;
            if (segLength <= 0.05) return null;

            // Render all wall segments to prevent gaps and jagged edges
            // (Rooms will render adjacent inner walls forming a clean union)

            return (
              <group key={`front-seg-${idx}`} position={[xStart, 0, height - t]} rotation={[0, 0, 0]}>
                <ArchitecturalWall 
                  globalStyle={globalStyle}
                  wallName="front" 
                  length={segLength} 
                  thickness={t} 
                  roomHeight={roomHeight} 
                  openings={openings.map(o => ({...o, offset: o.offset - xStart})).filter(o => o.wall === 'front' && o.offset >= 0 && o.offset + o.width <= segLength)} 
                  color={color} 
                  isSelected={isSelected} 
                  blueprintMode={blueprintMode} 
                  wireframeMode={wireframeMode}
                  onClick={onSelect}
                  onAddOpening={placeMode !== 'select' ? () => onAddOpening('front') : undefined}
                  placeMode={placeMode}
                />
              </group>
            );
          })}

          {/* 3. Left Wall segments */}
          {walls.left.map((seg, idx) => {
            const zStart = seg.start - y;
            const zEnd = seg.end - y;
            const segLength = zEnd - zStart;
            if (segLength <= 0.05) return null;

            // Render all wall segments to prevent gaps and jagged edges
            // (Rooms will render adjacent inner walls forming a clean union)

            return (
              <group key={`left-seg-${idx}`} position={[t, 0, zStart]} rotation={[0, -Math.PI / 2, 0]}>
                <ArchitecturalWall 
                  globalStyle={globalStyle}
                  wallName="left" 
                  length={segLength} 
                  thickness={t} 
                  roomHeight={roomHeight} 
                  openings={openings.map(o => ({...o, offset: o.offset - zStart})).filter(o => o.wall === 'left' && o.offset >= 0 && o.offset + o.width <= segLength)} 
                  color={color} 
                  isSelected={isSelected} 
                  blueprintMode={blueprintMode} 
                  wireframeMode={wireframeMode}
                  onClick={onSelect}
                  onAddOpening={placeMode !== 'select' ? () => onAddOpening('left') : undefined}
                  placeMode={placeMode}
                />
              </group>
            );
          })}

          {/* 4. Right Wall segments */}
          {walls.right.map((seg, idx) => {
            const zStart = seg.start - y;
            const zEnd = seg.end - y;
            const segLength = zEnd - zStart;
            if (segLength <= 0.05) return null;

            // Render all wall segments to prevent gaps and jagged edges
            // (Rooms will render adjacent inner walls forming a clean union)

            return (
              <group key={`right-seg-${idx}`} position={[width, 0, zStart]} rotation={[0, -Math.PI / 2, 0]}>
                <ArchitecturalWall 
                  globalStyle={globalStyle}
                  wallName="right" 
                  length={segLength} 
                  thickness={t} 
                  roomHeight={roomHeight} 
                  openings={openings.map(o => ({...o, offset: o.offset - zStart})).filter(o => o.wall === 'right' && o.offset >= 0 && o.offset + o.width <= segLength)} 
                  color={color} 
                  isSelected={isSelected} 
                  blueprintMode={blueprintMode} 
                  wireframeMode={wireframeMode}
                  onClick={onSelect}
                  onAddOpening={placeMode !== 'select' ? () => onAddOpening('right') : undefined}
                  placeMode={placeMode}
                />
              </group>
            );
          })}
        </group>
      )}

      {/* C. ELECTRICAL OVERLAY LAYER (LAYER: ELECTRICAL) */}
      {electricalLayer && (
        <group>
          {/* Ceiling Fan in center */}
          <mesh position={[width / 2, roomHeight, height / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
          {/* Fan blades wireframe */}
          <Line 
            points={[
              new THREE.Vector3(width / 2 - 0.5, roomHeight - 0.01, height / 2),
              new THREE.Vector3(width / 2 + 0.5, roomHeight - 0.01, height / 2)
            ]}
            color="#fbbf24"
            lineWidth={1.5}
          />
          <Line 
            points={[
              new THREE.Vector3(width / 2, roomHeight - 0.01, height / 2 - 0.5),
              new THREE.Vector3(width / 2, roomHeight - 0.01, height / 2 + 0.5)
            ]}
            color="#fbbf24"
            lineWidth={1.5}
          />
          {/* Wall switch outlets glowing on left wall */}
          <mesh position={[t + 0.02, 0.3, height / 2]}>
            <boxGeometry args={[0.02, 0.1, 0.12]} />
            <meshBasicMaterial color="#fcd34d" />
          </mesh>
          {/* Electrical dashed wiring linking switch to center light */}
          <Line 
            points={[
              new THREE.Vector3(t + 0.02, 0.3, height / 2),
              new THREE.Vector3(width / 2, roomHeight, height / 2)
            ]}
            color="#fbbf24"
            lineWidth={1}
            dashed
            dashSize={0.1}
            gapSize={0.1}
          />
        </group>
      )}

      {/* D. PLUMBING PIPELINE OVERLAY (LAYER: PLUMBING) */}
      {plumbingLayer && isWetRoom && (
        <group>
          {/* Bathroom plumbing (Toilet + sink nodes) */}
          {name.toLowerCase().includes('toilet') || name.toLowerCase().includes('bath') ? (
            <group>
              {/* Commode ring */}
              <mesh position={[width - t - 0.4, 0.25, height / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
              {/* Washbasin */}
              <mesh position={[t + 0.3, 0.45, t + 0.3]}>
                <boxGeometry args={[0.4, 0.1, 0.4]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
              {/* Pipelines (Blue cold water) */}
              <Line 
                points={[
                  new THREE.Vector3(t + 0.3, 0.05, t + 0.3),
                  new THREE.Vector3(width - t - 0.4, 0.05, height / 2)
                ]}
                color="#0ea5e9"
                lineWidth={2}
              />
            </group>
          ) : (
            // Kitchen countertop plumbing (Sink node)
            <group>
              <mesh position={[width / 2, 0.4, t + 0.4]}>
                <boxGeometry args={[0.5, 0.1, 0.4]} />
                <meshBasicMaterial color="#0ea5e9" />
              </mesh>
              {/* Pipe connection going to outer wall */}
              <Line 
                points={[
                  new THREE.Vector3(width / 2, 0.05, t + 0.4),
                  new THREE.Vector3(width / 2, 0.05, 0)
                ]}
                color="#0ea5e9"
                lineWidth={2.5}
              />
            </group>
          )}
        </group>
      )}

      {/* E. HIGH-FIDELITY REALISTIC 3D FURNITURE LAYER (LAYER: FURNITURE) */}
      {furnitureLayer && !wireframeMode && (
        <group>
          {/* 1. BEDROOM FURNITURE */}
          {(name.toLowerCase().includes('bed') || name.toLowerCase().includes('suite') || name.toLowerCase().includes('kids')) && (
            <group>
              {/* Bed Frame Platform */}
              <mesh position={[width * 0.5, 0.09, height * 0.5]} castShadow>
                <boxGeometry args={[width * 0.6, 0.18, height * 0.6]} />
                <meshStandardMaterial color="#27272a" roughness={0.8} metalness={0.1} />
                <Edges scale={1} threshold={15} color="#09090b" />
              </mesh>

              {/* White Fabric Mattress */}
              <mesh position={[width * 0.5, 0.27, height * 0.5]} castShadow>
                <boxGeometry args={[width * 0.58, 0.18, height * 0.58]} />
                <meshStandardMaterial color="#fafafa" roughness={0.9} />
                <Edges scale={1} threshold={15} color="#e4e4e7" />
              </mesh>

              {/* Elegant Pink Velvet Headboard */}
              <mesh position={[width * 0.5, 0.44, height * 0.2]} castShadow>
                <boxGeometry args={[width * 0.6, 0.52, 0.08]} />
                <meshStandardMaterial color="#ec4899" roughness={0.7} />
                <Edges scale={1} threshold={15} color="#db2777" />
              </mesh>

              {/* Pillow 1 */}
              <mesh position={[width * 0.36, 0.38, height * 0.305]} castShadow>
                <boxGeometry args={[width * 0.22, 0.06, height * 0.15]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
                <Edges scale={1} threshold={15} color="#fbcfe8" />
              </mesh>

              {/* Pillow 2 */}
              <mesh position={[width * 0.64, 0.38, height * 0.305]} castShadow>
                <boxGeometry args={[width * 0.22, 0.06, height * 0.15]} />
                <meshStandardMaterial color="#ffffff" roughness={0.9} />
                <Edges scale={1} threshold={15} color="#fbcfe8" />
              </mesh>

              {/* Folded Pink Velvet Blanket */}
              <mesh position={[width * 0.5, 0.37, height * 0.65]} castShadow>
                <boxGeometry args={[width * 0.582, 0.02, height * 0.3]} />
                <meshStandardMaterial color="#db2777" roughness={0.6} />
                <Edges scale={1} threshold={15} color="#9d174d" />
              </mesh>

              {/* Bedside Nightstand 1 */}
              <mesh position={[width * 0.11, 0.18, height * 0.26]} castShadow>
                <boxGeometry args={[width * 0.1, 0.36, height * 0.12]} />
                <meshStandardMaterial color="#18181b" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>

              {/* Nightstand 1 Drawer Handle (Pink) */}
              <mesh position={[width * 0.11, 0.26, height * 0.322]}>
                <boxGeometry args={[0.08, 0.02, 0.01]} />
                <meshBasicMaterial color="#ec4899" />
              </mesh>

              {/* Bedside Nightstand 2 */}
              <mesh position={[width * 0.89, 0.18, height * 0.26]} castShadow>
                <boxGeometry args={[width * 0.1, 0.36, height * 0.12]} />
                <meshStandardMaterial color="#18181b" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>

              {/* Nightstand 2 Drawer Handle (Pink) */}
              <mesh position={[width * 0.89, 0.26, height * 0.322]}>
                <boxGeometry args={[0.08, 0.02, 0.01]} />
                <meshBasicMaterial color="#ec4899" />
              </mesh>

              {/* Nightstand 1 Lamp */}
              <group>
                <mesh position={[width * 0.11, 0.44, height * 0.26]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
                  <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[width * 0.11, 0.54, height * 0.26]} castShadow>
                  <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
                  <meshStandardMaterial color="#ffedd5" transparent opacity={0.9} roughness={0.9} />
                </mesh>
                <pointLight position={[width * 0.11, 0.54, height * 0.26]} intensity={0.8} distance={2.5} color="#ffd700" />
              </group>

              {/* Nightstand 2 Lamp */}
              <group>
                <mesh position={[width * 0.89, 0.44, height * 0.26]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
                  <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[width * 0.89, 0.54, height * 0.26]} castShadow>
                  <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
                  <meshStandardMaterial color="#ffedd5" transparent opacity={0.9} roughness={0.9} />
                </mesh>
                <pointLight position={[width * 0.89, 0.54, height * 0.26]} intensity={0.8} distance={2.5} color="#ffd700" />
              </group>
            </group>
          )}

          {/* 2. LIVING / HALL / LOUNGE / FOYER */}
          {(name.toLowerCase().includes('living') || name.toLowerCase().includes('hall') || name.toLowerCase().includes('lounge') || name.toLowerCase().includes('foyer')) && (
            <group>
              {/* L-Sofa Main Frame */}
              <mesh position={[width * 0.5, 0.12, height * 0.215]} castShadow>
                <boxGeometry args={[width * 0.7, 0.24, height * 0.13]} />
                <meshStandardMaterial color="#1e293b" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#0f172a" />
              </mesh>

              {/* L-Sofa Main Cushions (Vibrant Pink) */}
              <mesh position={[width * 0.5, 0.27, height * 0.215]} castShadow>
                <boxGeometry args={[width * 0.68, 0.08, height * 0.12]} />
                <meshStandardMaterial color="#ec4899" roughness={0.7} />
                <Edges scale={1} threshold={15} color="#db2777" />
              </mesh>

              {/* L-Sofa Extension Frame */}
              <mesh position={[width * 0.785, 0.12, height * 0.39]} castShadow>
                <boxGeometry args={[width * 0.13, 0.24, height * 0.22]} />
                <meshStandardMaterial color="#1e293b" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#0f172a" />
              </mesh>

              {/* L-Sofa Extension Cushions (Vibrant Pink) */}
              <mesh position={[width * 0.785, 0.27, height * 0.39]} castShadow>
                <boxGeometry args={[width * 0.12, 0.08, height * 0.21]} />
                <meshStandardMaterial color="#ec4899" roughness={0.7} />
                <Edges scale={1} threshold={15} color="#db2777" />
              </mesh>

              {/* Sofa Backrest Main */}
              <mesh position={[width * 0.5, 0.44, height * 0.165]} castShadow>
                <boxGeometry args={[width * 0.7, 0.4, 0.03]} />
                <meshStandardMaterial color="#1e293b" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#0f172a" />
              </mesh>

              {/* Sofa Backrest Extension (L-turn) */}
              <mesh position={[width * 0.835, 0.44, height * 0.39]} castShadow>
                <boxGeometry args={[0.03, 0.4, height * 0.22]} />
                <meshStandardMaterial color="#1e293b" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#0f172a" />
              </mesh>

              {/* Throw Pillows (Pink/White) */}
              <mesh position={[width * 0.2, 0.34, height * 0.215]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[0.12, 0.12, 0.03]} />
                <meshStandardMaterial color="#fafafa" roughness={0.9} />
              </mesh>
              <mesh position={[width * 0.35, 0.34, height * 0.215]} rotation={[0, -0.15, 0]}>
                <boxGeometry args={[0.12, 0.12, 0.03]} />
                <meshStandardMaterial color="#fbcfe8" roughness={0.9} />
              </mesh>

              {/* Coffee Table Base */}
              <mesh position={[width * 0.5, 0.075, height * 0.61]} castShadow>
                <boxGeometry args={[width * 0.25, 0.15, height * 0.18]} />
                <meshStandardMaterial color="#020617" roughness={0.9} />
                <Edges scale={1} threshold={15} color="#4ecdc4" />
              </mesh>

              {/* Premium Glass Tabletop (Glossy Black/Pink outline) */}
              <mesh position={[width * 0.5, 0.16, height * 0.61]} castShadow>
                <boxGeometry args={[width * 0.3, 0.02, height * 0.22]} />
                <meshStandardMaterial color="#1f2937" roughness={0.1} metalness={0.8} transparent opacity={0.85} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>
            </group>
          )}

          {/* 3. KITCHEN */}
          {name.toLowerCase().includes('kitchen') && (
            <group>
              {/* L-Cabinet Base Counter (Left-to-Right along Back wall) */}
              <mesh position={[width / 2, 0.41, t + 0.3]} castShadow>
                <boxGeometry args={[width - 2 * t, 0.82, 0.6]} />
                <meshStandardMaterial color="#09090b" roughness={0.7} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>

              {/* L-Cabinet Base Counter (Along Right wall) */}
              <mesh position={[width - t - 0.3, 0.41, t + 0.6 + (height - 2 * t - 0.6) / 2]} castShadow>
                <boxGeometry args={[0.6, 0.82, height - 2 * t - 0.6]} />
                <meshStandardMaterial color="#09090b" roughness={0.7} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>

              {/* Polished White Quartz Countertops */}
              <mesh position={[width / 2, 0.83, t + 0.3]} castShadow>
                <boxGeometry args={[width - 2 * t + 0.02, 0.03, 0.62]} />
                <meshStandardMaterial color="#fafaf9" roughness={0.25} />
                <Edges scale={1} threshold={15} color="#ebd3f8" />
              </mesh>
              <mesh position={[width - t - 0.3, 0.83, t + 0.59 + (height - 2 * t - 0.59) / 2]} castShadow>
                <boxGeometry args={[0.62, 0.03, height - 2 * t - 0.57]} />
                <meshStandardMaterial color="#fafaf9" roughness={0.25} />
                <Edges scale={1} threshold={15} color="#ebd3f8" />
              </mesh>

              {/* Stove Cooktop Hob (Glass surface) */}
              <mesh position={[width * 0.335, 0.85, t + 0.3]} castShadow>
                <boxGeometry args={[width * 0.23, 0.01, 0.4]} />
                <meshStandardMaterial color="#1e293b" roughness={0.1} metalness={0.8} />
                <Edges scale={1} threshold={15} color="#eab308" />
              </mesh>

              {/* Burner 1 (Left Ring & Core) */}
              <group position={[width * 0.29, 0.856, t + 0.3]}>
                <mesh>
                  <cylinderGeometry args={[0.08, 0.08, 0.015, 16]} />
                  <meshStandardMaterial color="#334155" metalness={0.7} />
                </mesh>
                <mesh position={[0, 0.005, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.015, 8]} />
                  <meshStandardMaterial color="#eab308" roughness={0.4} />
                </mesh>
              </group>

              {/* Burner 2 (Right Ring & Core) */}
              <group position={[width * 0.38, 0.856, t + 0.3]}>
                <mesh>
                  <cylinderGeometry args={[0.08, 0.08, 0.015, 16]} />
                  <meshStandardMaterial color="#334155" metalness={0.7} />
                </mesh>
                <mesh position={[0, 0.005, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.015, 8]} />
                  <meshStandardMaterial color="#eab308" roughness={0.4} />
                </mesh>
              </group>

              {/* Double Bowl Sink Inset Frame */}
              <mesh position={[width - t - 0.3, 0.85, height * 0.45]} castShadow>
                <boxGeometry args={[0.42, 0.01, height * 0.305]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
              </mesh>

              {/* Left Bowl Chrome Recess */}
              <mesh position={[width - t - 0.39, 0.81, height * 0.45]} castShadow>
                <boxGeometry args={[0.18, 0.08, height * 0.26]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
              </mesh>

              {/* Right Bowl Chrome Recess */}
              <mesh position={[width - t - 0.21, 0.81, height * 0.45]} castShadow>
                <boxGeometry args={[0.18, 0.08, height * 0.26]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
              </mesh>

              {/* High-neck Curved Chrome Faucet */}
              <group position={[width - t - 0.3, 0.855, height * 0.26]}>
                <mesh position={[0, 0.12, 0.04]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.24, 8]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
                <mesh position={[0, 0.23, 0.08]} rotation={[Math.PI / 4, 0, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>
            </group>
          )}

          {/* 4. BATHROOM / TOILET */}
          {(name.toLowerCase().includes('bath') || name.toLowerCase().includes('toilet') || name.toLowerCase().includes('powder')) && (
            <group>
              {/* Glass Shower Cabin Platform Base */}
              <mesh position={[t + 0.45, 0.04, height - t - 0.45]} castShadow>
                <boxGeometry args={[0.9, 0.08, 0.9]} />
                <meshStandardMaterial color="#334155" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>

              {/* Translucent Shower Cabin Glass Screen 1 (Front edge) */}
              <mesh position={[t + 0.45, 0.98, height - t - 0.9]}>
                <boxGeometry args={[0.9, 1.8, 0.01]} />
                <meshStandardMaterial color="#22d3ee" transparent opacity={0.25} roughness={0.1} metalness={0.8} />
                <Edges scale={1} threshold={15} color="#4ecdc4" />
              </mesh>

              {/* Translucent Shower Cabin Glass Screen 2 (Right edge) */}
              <mesh position={[t + 0.9, 0.98, height - t - 0.45]}>
                <boxGeometry args={[0.01, 1.8, 0.9]} />
                <meshStandardMaterial color="#22d3ee" transparent opacity={0.25} roughness={0.1} metalness={0.8} />
                <Edges scale={1} threshold={15} color="#4ecdc4" />
              </mesh>

              {/* Shower Column Column/Sprayer */}
              <group position={[t + 0.05, 0.94, height - t - 0.05]}>
                <mesh>
                  <cylinderGeometry args={[0.01, 0.01, 1.8, 8]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
                {/* Sprayer head */}
                <mesh position={[0.06, 0.86, 0.06]} rotation={[0, 0, -Math.PI / 4]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>

              {/* Wall-Hung Toilet Commode Tank */}
              <mesh position={[width - t - 0.08, 0.42, height * 0.35]} castShadow>
                <boxGeometry args={[0.16, 0.48, 0.26]} />
                <meshStandardMaterial color="#fafafa" roughness={0.2} />
                <Edges scale={1} threshold={15} color="#e4e4e7" />
              </mesh>

              {/* Toilet Seat Bowl */}
              <mesh position={[width - t - 0.26, 0.2, height * 0.35]} castShadow>
                <boxGeometry args={[0.24, 0.28, 0.26]} />
                <meshStandardMaterial color="#fafafa" roughness={0.2} />
                <Edges scale={1} threshold={15} color="#e4e4e7" />
              </mesh>

              {/* Washbasin Vanity Cabinet */}
              <mesh position={[width * 0.325, 0.34, t + 0.19]} castShadow>
                <boxGeometry args={[width * 0.25, 0.68, 0.38]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>

              {/* Ceramic Vessel Basin Bowl */}
              <mesh position={[width * 0.325, 0.72, t + 0.19]} castShadow>
                <cylinderGeometry args={[0.11, 0.09, 0.08, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} />
                <Edges scale={1} threshold={15} color="#e2e8f0" />
              </mesh>

              {/* Chrome Faucet */}
              <mesh position={[width * 0.325, 0.82, t + 0.07]} rotation={[Math.PI / 6, 0, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
              </mesh>
            </group>
          )}

          {/* 5. POOJA MANDIR */}
          {(name.toLowerCase().includes('pooja') || name.toLowerCase().includes('puja') || name.toLowerCase().includes('mandir') || name.toLowerCase().includes('dome')) && (
            <group>
              {/* Concentric Elevated Circular Marble Base */}
              <mesh position={[width * 0.5, 0.04, height * 0.5]} castShadow>
                <cylinderGeometry args={[Math.min(width, height) * 0.35, Math.min(width, height) * 0.35, 0.08, 32]} />
                <meshStandardMaterial color="#fafaf9" roughness={0.2} />
                <Edges scale={1} threshold={15} color="#eab308" />
              </mesh>

              {/* Inlaid Glowing Golden Sacred Star (Hexagram outline) */}
              <group position={[width * 0.5, 0.085, height * 0.5]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[Math.min(width, height) * 0.23, Math.min(width, height) * 0.25, 6]} />
                  <meshBasicMaterial color="#eab308" />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
                  <ringGeometry args={[Math.min(width, height) * 0.23, Math.min(width, height) * 0.25, 6]} />
                  <meshBasicMaterial color="#eab308" />
                </mesh>
              </group>

              {/* Wooden Pedestal Shrine Base */}
              <mesh position={[width * 0.5, 0.11, height * 0.5]} castShadow>
                <boxGeometry args={[0.45, 0.06, 0.45]} />
                <meshStandardMaterial color="#78350f" roughness={0.6} />
                <Edges scale={1} threshold={15} color="#eab308" />
              </mesh>

              {/* Mandir 4 Corner Pillars */}
              <mesh position={[width * 0.5 - 0.19, 0.36, height * 0.5 - 0.19]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[width * 0.5 + 0.19, 0.36, height * 0.5 - 0.19]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[width * 0.5 - 0.19, 0.36, height * 0.5 + 0.19]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
              </mesh>
              <mesh position={[width * 0.5 + 0.19, 0.36, height * 0.5 + 0.19]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
              </mesh>

              {/* Mandir Roof Cover */}
              <mesh position={[width * 0.5, 0.6, height * 0.5]} castShadow>
                <boxGeometry args={[0.48, 0.05, 0.48]} />
                <meshStandardMaterial color="#78350f" roughness={0.6} />
              </mesh>

              {/* Mandir Shikhara Dome Canopy */}
              <mesh position={[width * 0.5, 0.725, height * 0.5]} castShadow>
                <coneGeometry args={[0.18, 0.2, 8]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
              </mesh>

              {/* Sacred Brass Diya with glowing flame */}
              <group position={[width * 0.5, 0.16, height * 0.5]}>
                <mesh>
                  <cylinderGeometry args={[0.04, 0.03, 0.03, 12]} />
                  <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Glowing Flame */}
                <mesh position={[0, 0.04, 0]}>
                  <sphereGeometry args={[0.015, 8, 8]} />
                  <meshBasicMaterial color="#ff6b35" />
                </mesh>
                <pointLight position={[0, 0.06, 0]} intensity={1.5} distance={3.0} color="#ff6b35" />
              </group>
            </group>
          )}

          {/* 6. DINING */}
          {name.toLowerCase().includes('dining') && (
            <group>
              {/* Glass Dining Table Top */}
              <mesh position={[width * 0.5, 0.73, height * 0.5]} castShadow>
                <boxGeometry args={[width * 0.44, 0.02, height * 0.4]} />
                <meshStandardMaterial color="#fbcfe8" transparent opacity={0.4} roughness={0.1} metalness={0.8} />
                <Edges scale={1} threshold={15} color="#ec4899" />
              </mesh>

              {/* Table Legs */}
              <mesh position={[width * 0.3, 0.36, height * 0.32]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.72, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
              <mesh position={[width * 0.7, 0.36, height * 0.32]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.72, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
              <mesh position={[width * 0.3, 0.36, height * 0.68]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.72, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>
              <mesh position={[width * 0.7, 0.36, height * 0.68]} castShadow>
                <cylinderGeometry args={[0.015, 0.015, 0.72, 8]} />
                <meshStandardMaterial color="#1e293b" roughness={0.7} />
              </mesh>

              {/* 4 Minimalist Dining Chairs */}
              {/* Chair 1 (Top Left) */}
              <group position={[width * 0.42, 0.22, height * 0.23]}>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <boxGeometry args={[0.26, 0.03, 0.26]} />
                  <meshStandardMaterial color="#ec4899" roughness={0.7} />
                  <Edges scale={1} threshold={15} color="#db2777" />
                </mesh>
                <mesh position={[0, 0.38, -0.12]} castShadow>
                  <boxGeometry args={[0.26, 0.34, 0.02]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
              </group>

              {/* Chair 2 (Top Right) */}
              <group position={[width * 0.58, 0.22, height * 0.23]}>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <boxGeometry args={[0.26, 0.03, 0.26]} />
                  <meshStandardMaterial color="#ec4899" roughness={0.7} />
                  <Edges scale={1} threshold={15} color="#db2777" />
                </mesh>
                <mesh position={[0, 0.38, -0.12]} castShadow>
                  <boxGeometry args={[0.26, 0.34, 0.02]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
              </group>

              {/* Chair 3 (Bottom Left) */}
              <group position={[width * 0.42, 0.22, height * 0.77]}>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <boxGeometry args={[0.26, 0.03, 0.26]} />
                  <meshStandardMaterial color="#ec4899" roughness={0.7} />
                  <Edges scale={1} threshold={15} color="#db2777" />
                </mesh>
                <mesh position={[0, 0.38, 0.12]} castShadow>
                  <boxGeometry args={[0.26, 0.34, 0.02]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
              </group>

              {/* Chair 4 (Bottom Right) */}
              <group position={[width * 0.58, 0.22, height * 0.77]}>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <boxGeometry args={[0.26, 0.03, 0.26]} />
                  <meshStandardMaterial color="#ec4899" roughness={0.7} />
                  <Edges scale={1} threshold={15} color="#db2777" />
                </mesh>
                <mesh position={[0, 0.38, 0.12]} castShadow>
                  <boxGeometry args={[0.26, 0.34, 0.02]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.8} />
                </mesh>
              </group>
            </group>
          )}

          {/* 7. BRAHMASTHAN */}
          {name.toLowerCase().includes('brahmasthan') && (
            <group>
              {/* Floor Inlay Medallion Ring */}
              <mesh position={[width * 0.5, 0.005, height * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[width * 0.34, width * 0.36, 64]} />
                <meshBasicMaterial color="#eab308" />
              </mesh>
              <mesh position={[width * 0.5, 0.005, height * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[width * 0.11, width * 0.12, 32]} />
                <meshBasicMaterial color="#eab308" />
              </mesh>

              {/* Sacred Energy Orb */}
              <group position={[width * 0.5, 0.1, height * 0.5]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.08, 16, 16]} />
                  <meshBasicMaterial color="#ffd700" transparent opacity={0.85} />
                </mesh>
                <pointLight intensity={1.2} distance={3.0} color="#ffd700" />
              </group>
            </group>
          )}
        </group>
      )}

      {/* F. DIMENSION LINES (ACTIVE IN BLUEPRINT / TOP-VIEW) */}
      {blueprintMode && (
        <group>
          {/* Bottom horizontal dimension line */}
          <Line 
            points={[
              new THREE.Vector3(0, 0.02, -0.4),
              new THREE.Vector3(width, 0.02, -0.4)
            ]}
            color="#eab308"
            lineWidth={1.2}
          />
          {/* Extenders */}
          <Line points={[new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(0, 0.02, -0.45)]} color="#eab308" lineWidth={0.5} />
          <Line points={[new THREE.Vector3(width, 0.02, 0), new THREE.Vector3(width, 0.02, -0.45)]} color="#eab308" lineWidth={0.5} />
          {/* Dimension Value tag */}
          <Html position={[width / 2, 0.1, -0.45]} center>
            <div style={{ background: '#111827', border: '1px solid #eab308', padding: '1px 4px', color: '#eab308', fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {unit === 'ft' ? `${(width * 3.28084).toFixed(1)}'` : `${width.toFixed(2)}m`}
            </div>
          </Html>

          {/* Left vertical dimension line */}
          <Line 
            points={[
              new THREE.Vector3(-0.4, 0.02, 0),
              new THREE.Vector3(-0.4, 0.02, height)
            ]}
            color="#eab308"
            lineWidth={1.2}
          />
          {/* Extenders */}
          <Line points={[new THREE.Vector3(0, 0.02, 0), new THREE.Vector3(-0.45, 0.02, 0)]} color="#eab308" lineWidth={0.5} />
          <Line points={[new THREE.Vector3(0, 0.02, height), new THREE.Vector3(-0.45, 0.02, height)]} color="#eab308" lineWidth={0.5} />
          {/* Dimension Value tag */}
          <Html position={[-0.45, 0.1, height / 2]} center>
            <div style={{ background: '#111827', border: '1px solid #eab308', padding: '1px 4px', color: '#eab308', fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {unit === 'ft' ? `${(height * 3.28084).toFixed(1)}'` : `${height.toFixed(2)}m`}
            </div>
          </Html>
        </group>
      )}

      {/* Elegant Room Label Tag */}
      <Html position={[width / 2, roomHeight + 0.15, height / 2]} center>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          style={{ 
            color: 'white', 
            fontSize: '10px', 
            fontWeight: '700', 
            letterSpacing: '0.5px', 
            cursor: 'pointer',
            textShadow: '0px 2px 4px rgba(0,0,0,0.9)', 
            whiteSpace: 'nowrap',
            background: isSelected ? '#ec4899' : (blueprintMode ? 'rgba(11, 26, 48, 0.9)' : 'rgba(23, 23, 29, 0.85)'),
            border: isSelected ? '1px solid #ebd3f8' : (blueprintMode ? '1px solid #4ecdc4' : '1px solid rgba(255, 255, 255, 0.1)'),
            boxShadow: isSelected ? '0 0 10px rgba(236, 72, 153, 0.5)' : 'none',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.2s ease'
          }}
        >
          {name}
        </div>
      </Html>

      {/* Hovering Live Dimensions Badge */}
      {isSelected && (
        <Html position={[width / 2, roomHeight + 0.5, height / 2]} center>
          <div 
            style={{
              background: 'rgba(236, 72, 153, 0.95)',
              border: '1px solid #ebd3f8',
              boxShadow: '0 0 15px rgba(236, 72, 153, 0.6)',
              borderRadius: '6px',
              padding: '3px 8px',
              color: 'white',
              fontSize: '10px',
              fontWeight: '800',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            📏 {formattedDimensions}
          </div>
        </Html>
      )}
    </group>
  );
}

function VastuCompass({ show }) {
  if (!show) return null;
  
  const zones = [
    { dir: 'N', label: 'North', angle: 0, x: 0, z: -6.5, color: '#60a5fa', element: 'Water' },
    { dir: 'NE', label: 'NE (Ishaan)', angle: Math.PI / 4, x: 4.6, z: -4.6, color: '#ffd700', element: 'Divine' },
    { dir: 'E', label: 'East', angle: Math.PI / 2, x: 6.5, z: 0, color: '#f59e0b', element: 'Light' },
    { dir: 'SE', label: 'SE (Agni)', angle: (3 * Math.PI) / 4, x: 4.6, z: 4.6, color: '#f97316', element: 'Fire' },
    { dir: 'S', label: 'South', angle: Math.PI, x: 0, z: 6.5, color: '#ef4444', element: 'Yama' },
    { dir: 'SW', label: 'SW (Nairutya)', angle: (5 * Math.PI) / 4, x: -4.6, z: 4.6, color: '#84cc16', element: 'Stability' },
    { dir: 'W', label: 'West', angle: (3 * Math.PI) / 2, x: -6.5, z: 0, color: '#a855f7', element: 'Varun' },
    { dir: 'NW', label: 'NW (Vayu)', angle: (7 * Math.PI) / 4, x: -4.6, z: -4.6, color: '#06b6d4', element: 'Air' }
  ];

  return (
    <group position={[0, 0.05, 0]}>
      {/* Outer Compass Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.3, 6.5, 64]} />
        <meshBasicMaterial color="#ec4899" opacity={0.55} transparent />
      </mesh>
      
      {/* Dynamic Cardinal Ray Lines */}
      {zones.map((z, idx) => {
        const rad = z.angle;
        return (
          <group key={idx} rotation={[0, -rad, 0]}>
            <mesh position={[0, 0, -3.25]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.02, 6.5]} />
              <meshBasicMaterial color="#ec4899" opacity={0.15} transparent />
            </mesh>
          </group>
        );
      })}

      {/* Floating Spatial HTML Zone Badges */}
      {zones.map((z, idx) => (
        <Html key={idx} position={[z.x, 0.4, z.z]} center>
          <div 
            style={{
              background: 'rgba(17, 17, 22, 0.9)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${z.color}`,
              boxShadow: `0 0 12px ${z.color}44`,
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'white',
              fontSize: '11px',
              fontWeight: '700',
              textAlign: 'center',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              transform: 'scale(0.95)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1px'
            }}
          >
            <div style={{ color: z.color, fontSize: '13px', letterSpacing: '0.5px' }}>{z.dir}</div>
            <div style={{ fontSize: '9px', opacity: 0.85 }}>{z.label}</div>
            <div style={{ fontSize: '8px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>({z.element})</div>
          </div>
        </Html>
      ))}
    </group>
  );
}

function CameraController({ viewMode, resetCounter }) {
  const { camera } = useThree();

  const applyCameraConfig = () => {
    if (viewMode === '2D') {
      // Precise top-down flat angle
      camera.position.set(0, 20, 0.01);
      camera.lookAt(0, 0, 0);
    } else {
      // Angled 3D view — slightly lower than before so users can see all 4 sides
      camera.position.set(10, 8, 14);
      camera.lookAt(0, 1, 0);
    }
    camera.updateProjectionMatrix();
  };

  useEffect(() => {
    applyCameraConfig();
  }, [viewMode, camera]);

  useEffect(() => {
    if (resetCounter > 0) {
      applyCameraConfig();
    }
  }, [resetCounter]);

  return null;
}

// Global Canvas Ref Provider
export default function ThreeViewer({ 
  floorPlan, 
  selectedRoomId, 
  onSelectRoom,
  viewMode,
  wireframeMode,
  showVastuOverlay,
  resetCounter,
  activeFloor,
  
  // NEW CAD PRESETS
  blueprintMode = false,
  electricalLayer = false,
  plumbingLayer = false,
  structureLayer = true,
  furnitureLayer = true,
  sunTime = 12,
  plotFacing = 'East',
  unit = 'm',
  canvasRef = null,
  onHoverRoom,
  placeMode = 'select',
  onAddOpening
}) {
  const { t } = useTranslation();
  
  if (!floorPlan || !floorPlan.rooms) return null;

  // Pre-compute globally synchronized door & window openings for ALL rooms.
  // This guarantees shared walls get matching holes on BOTH sides — no ghost gaps.
  const globalOpenings = useMemo(() => generateGlobalOpenings(floorPlan.rooms), [floorPlan.rooms]);

  // 1. Calculate Sun Position (math based on Facing & Time slider)
  // Time ranges from 6 (6AM) to 18 (6PM). Pivot around 12 (Noon).
  const sunData = useMemo(() => {
    let facingAngle = 0;
    if (plotFacing === 'North') facingAngle = Math.PI / 2;
    else if (plotFacing === 'West') facingAngle = Math.PI;
    else if (plotFacing === 'South') facingAngle = (3 * Math.PI) / 2;

    const hourOffset = (sunTime - 6) / 12; // 0 to 1
    const sunTheta = hourOffset * Math.PI; // 0 to 180 degrees (Sunrise to Sunset)

    // Calculate light coordinates
    const radius = 15;
    // Rotate trajectory based on plot facing orientation
    const posX = radius * Math.cos(sunTheta + facingAngle);
    const posZ = radius * Math.sin(sunTheta + facingAngle);
    const posY = radius * Math.sin(sunTheta); // arcs overhead

    // Sun intensity & color logic
    let lightColor = "#ffffff";
    let intensity = 1.6;
    let ambientIntensity = 1.0;
    let ambientColor = "#ffffff";

    if (sunTime < 7 || sunTime > 17) {
      // Golden Hour Orange
      lightColor = "#ffb076";
      intensity = 1.1;
      ambientColor = "#fed7aa";
    } else if (sunTime < 9 || sunTime > 15) {
      // Warm Amber
      lightColor = "#ffe4b5";
      intensity = 1.4;
      ambientColor = "#ffedd5";
    }

    // Sky/Ground ambient logic for night levels if user slides outside day bounds
    if (sunTime <= 6.2 || sunTime >= 17.8) {
      ambientIntensity = 0.25;
      ambientColor = "#1e1b4b"; // dim indigo
    }

    return {
      pos: [posX, posY, posZ],
      color: lightColor,
      intensity,
      ambIntensity: ambientIntensity,
      ambColor: ambientColor
    };
  }, [sunTime, plotFacing]);

  // Adjust canvas style: standard dark space grid or A3 Blueprint navy layout
  const themeBg = blueprintMode ? '#0c1a30' : '#0a0a0f';
  const gridColorPrimary = blueprintMode ? '#22d3ee' : '#1d2744'; // cyan in blueprint
  const gridColorSecondary = blueprintMode ? '#1e293b' : '#0d111d';

  return (
    <div className="w-full h-full relative" style={{ background: themeBg }}>
      <Canvas 
        shadows 
        gl={{ preserveDrawingBuffer: true }} // CRITICAL: allows taking High-res screenshot captures for jsPDF
        ref={canvasRef} 
        camera={{ position: [10, 8, 14], fov: 50 }}
      >
        {/* Ambient base lighting (shifts with sun simulated hour) */}
        <ambientLight intensity={sunData.ambIntensity} color={sunData.ambColor} />
        
        {/* Spotlight Sunlight (Casts detailed shadows through room doors & window gaps) */}
        {sunTime > 6 && sunTime < 18 && (
          <directionalLight 
            position={sunData.pos} 
            color={sunData.color}
            intensity={sunData.intensity} 
            castShadow 
            shadow-mapSize-width={2048} 
            shadow-mapSize-height={2048} 
            shadow-bias={-0.0005}
          />
        )}
        
        {/* Subtle filler pointlight */}
        <pointLight position={[-10, 12, -10]} intensity={0.2} color="#ffffff" />
        
        <group position={[0, -0.05, 0]}>
          {/* Shadow Receiver Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <shadowMaterial opacity={blueprintMode ? 0.1 : 0.35} />
          </mesh>
          {/* Premium Space Grid Helper matching layout themes */}
          <gridHelper 
            args={[50, 50, gridColorPrimary, gridColorSecondary]} 
            position={[0, 0.01, 0]} 
          />
        </group>
        
        {floorPlan.rooms.map(room => (
          <Room 
            key={room.id} 
            data={room} 
            allRooms={floorPlan.rooms}
            isSelected={room.id === selectedRoomId}
            onSelect={() => onSelectRoom && onSelectRoom(room.id)}
            onHover={onHoverRoom}
            wireframeMode={wireframeMode}
            activeFloor={activeFloor}
            globalOpenings={globalOpenings}
            
            // New CAD Layer inputs
            blueprintMode={blueprintMode}
            electricalLayer={electricalLayer}
            plumbingLayer={plumbingLayer}
            structureLayer={structureLayer}
            furnitureLayer={furnitureLayer}
            unit={unit}
            placeMode={placeMode}
            onAddOpening={(wallName) => {
              if (onAddOpening && placeMode !== 'select') {
                onAddOpening(room.id, wallName, placeMode);
              }
            }}
          />
        ))}

        <VastuCompass show={showVastuOverlay} />

        <CameraController viewMode={viewMode} resetCounter={resetCounter} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={viewMode === '3D'}
          // 2D: lock flat top-down. 3D: FULL vertical freedom — orbit under the house, see all 4 sides
          maxPolarAngle={viewMode === '2D' ? 0.01 : Math.PI}         // can look from directly above to directly below
          minPolarAngle={viewMode === '2D' ? 0.01 : 0}               // no lower clamp — full 360° vertical
          minDistance={3}          // can't zoom into the building itself
          maxDistance={40}         // sensible far clip so building stays visible
          panSpeed={0.8}
          rotateSpeed={0.6}        // slightly slowed for precision control
          zoomSpeed={1.2}
          dampingFactor={0.08}     // silky smooth inertia on all movement
          enableDamping={true}
          screenSpacePanning={true} // pan in screen-space so it feels natural from any angle
        />
      </Canvas>

      {/* SCALE RULER HUD overlay in bottom-right */}
      {blueprintMode && (
        <div style={{
          position: 'absolute',
          bottom: '2.5rem',
          right: '2.5rem',
          background: 'rgba(10, 26, 48, 0.85)',
          border: '1px solid #4ecdc4',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#4ecdc4',
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <div>SCALE: 1:100 (A3 Sheet)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ width: '40px', height: '3px', background: '#4ecdc4', display: 'inline-block' }} />
            <span>2.0 meters</span>
          </div>
        </div>
      )}
    </div>
  );
}
