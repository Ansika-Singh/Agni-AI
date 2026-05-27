import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Html } from '@react-three/drei';
import * as THREE from 'three';
import { generateGlobalOpenings } from './ThreeViewer';

// ─── HIGH-FIDELITY ARCHITECTURAL COMPONENTS ──────────────────────────────────

// A realistic multi-pane window with thick white frames and tinted glass
function HighFiWindow({ width, height, position, rotation = [0,0,0] }) {
  const frameThick = 0.08;
  const w = Math.min(width, 1.8); // max window width
  const h = height;
  return (
    <group position={position} rotation={rotation}>
      {/* Outer Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, h, 0.1]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.3} />
      </mesh>
      {/* Dark Tinted Glass - recessed slightly */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[w - frameThick*2, h - frameThick*2, 0.08]} />
        <meshStandardMaterial color="#1a202c" roughness={0.02} metalness={0.9} envMapIntensity={1.5} />
      </mesh>
      {/* Center Mullion (Vertical split) */}
      {w > 0.8 && (
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[frameThick, h - frameThick*2, 0.05]} />
          <meshStandardMaterial color="#f8f9fa" roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

// A realistic modern door
function HighFiDoor({ width, height, position, rotation = [0,0,0] }) {
  const frameThick = 0.08;
  return (
    <group position={position} rotation={rotation}>
      {/* Outer Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.3} />
      </mesh>
      {/* Wood Door slab - slightly recessed */}
      <mesh position={[0, -frameThick/2, 0.02]}>
        <boxGeometry args={[width - frameThick*2, height - frameThick, 0.08]} />
        <meshStandardMaterial color="#4e342e" roughness={0.7} metalness={0.1} />
      </mesh>
    </group>
  );
}

// Glass Railing with steel top rail
function GlassRailing({ width, depth, position }) {
  const height = 1.0;
  return (
    <group position={position}>
      {/* Front glass */}
      <mesh position={[0, height/2, depth/2]}>
        <boxGeometry args={[width, height, 0.02]} />
        <meshStandardMaterial color="#80d8ff" transparent opacity={0.35} roughness={0.05} metalness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Front top handrail */}
      <mesh position={[0, height, depth/2]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#b0bec5" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Left glass */}
      <mesh position={[-width/2, height/2, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[depth, height, 0.02]} />
        <meshStandardMaterial color="#80d8ff" transparent opacity={0.35} roughness={0.05} metalness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Left top handrail */}
      <mesh position={[-width/2, height, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[depth, 0.05, 0.05]} />
        <meshStandardMaterial color="#b0bec5" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Right glass */}
      <mesh position={[width/2, height/2, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[depth, height, 0.02]} />
        <meshStandardMaterial color="#80d8ff" transparent opacity={0.35} roughness={0.05} metalness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Right top handrail */}
      <mesh position={[width/2, height, 0]} rotation={[0, Math.PI/2, 0]}>
        <boxGeometry args={[depth, 0.05, 0.05]} />
        <meshStandardMaterial color="#b0bec5" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

// Architectural Pergola (wooden slats)
function Pergola({ width, depth, position }) {
  const beams = Math.floor(width / 0.4);
  return (
    <group position={position}>
      {/* Side support beams */}
      <mesh position={[-width/2 + 0.1, 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, depth]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh position={[width/2 - 0.1, 0.1, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, depth]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      
      {/* Cross slats */}
      {Array.from({length: beams}).map((_, i) => {
        const x = -width/2 + 0.2 + (i * (width - 0.4) / Math.max(1, beams - 1));
        return (
          <mesh key={i} position={[x, 0.25, 0]} castShadow>
            <boxGeometry args={[0.1, 0.15, depth + 0.4]} />
            <meshStandardMaterial color="#4e342e" roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

// Slatted wood wall cladding
function SlattedWall({ width, height, position, rotation = [0,0,0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color="#8d6e63" roughness={0.9} />
      </mesh>
      {/* Vertical slats pattern */}
      {Array.from({length: Math.floor(width / 0.15)}).map((_, i) => (
        <mesh key={i} position={[-width/2 + 0.075 + i*0.15, 0, 0.03]} castShadow>
          <boxGeometry args={[0.04, height, 0.02]} />
          <meshStandardMaterial color="#4e342e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── HIGH-QUALITY EXTERIOR RENDERER ──────────────────────────────────────────
function HouseExterior({ rooms, style, homeType }) {
  const isTraditional = style === 'Traditional Indian' || style === 'Royal/Heritage';
  
  if (!rooms || rooms.length === 0) return null;

  const globalOpenings = useMemo(() => generateGlobalOpenings(rooms), [rooms]);

  // Center the house geometry
  const allX = rooms.flatMap(r => [r.x, r.x + (r.width || r.w || 3)]);
  const allZ = rooms.flatMap(r => [r.y, r.y + (r.height || r.h || 3)]);
  const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
  const cz = (Math.min(...allZ) + Math.max(...allZ)) / 2;

  // Determine top floors for pergolas
  const maxFloor = Math.max(...rooms.map(r => r.floor || 0));

  return (
    <group position={[-cx, 0, -cz]}>
      {rooms.map((room, i) => {
        const w = room.width  || room.w || 3;
        const d = room.height || room.h || 3;
        const floorIdx = room.floor || 0;
        const FLOOR_H  = 3.2; // Taller floors for luxury feel
        const wallH    = FLOOR_H;
        const baseY    = floorIdx * FLOOR_H;

        const rx = room.x + w / 2;
        const rz = room.y + d / 2;
        const ry = baseY + wallH / 2;

        const isBalcony = room.name?.toLowerCase().includes('balcony');
        const isStairs  = room.name?.toLowerCase().includes('staircase');
        
        // Procedural material assignment for modern luxury look
        // We use the room.id length or hash to pseudorandomly assign a facade style
        const hash = room.id.length + floorIdx;
        let mainWallColor = "#e2e8f0"; // light grey/white
        if (hash % 3 === 0) mainWallColor = "#64748b"; // dark slate grey
        else if (hash % 4 === 0) mainWallColor = "#cbd5e1"; // medium grey

        const hasSlats = (!isTraditional && hash % 5 === 0 && !isBalcony && !isStairs);
        
        return (
          <group key={room.id}>
            
            {/* 1. Main Wall Block */}
            {!isBalcony && (
              <mesh position={[rx, ry, rz]} castShadow receiveShadow>
                <boxGeometry args={[w, wallH, d]} />
                <meshStandardMaterial color={mainWallColor} roughness={0.8} />
              </mesh>
            )}

            {/* 2. Balcony Handling (Just a slab + glass railing) */}
            {isBalcony && (
              <group>
                <mesh position={[rx, baseY + 0.1, rz]} castShadow receiveShadow>
                  <boxGeometry args={[w, 0.2, d]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.8} />
                </mesh>
                <GlassRailing width={w} depth={d} position={[rx, baseY + 0.2, rz]} />
              </group>
            )}

            {/* 3. Slatted Wood Cladding (only on some modern blocks, front face) */}
            {hasSlats && (
              <SlattedWall width={w} height={wallH} position={[rx, ry, rz + d/2 + 0.01]} />
            )}

            {/* 4. Floor Slab Overhangs (creates nice shadow lines) */}
            {!isBalcony && (
              <mesh position={[rx, baseY - 0.05, rz]} receiveShadow castShadow>
                <boxGeometry args={[w + 0.2, 0.15, d + 0.2]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.9} />
              </mesh>
            )}

            {/* 5. Windows & Doors (using room.openings or defaults) */}
            {!isBalcony && !isStairs && (
              <group>
                {(() => {
                  let ops = room.openings && room.openings.length > 0 ? room.openings : null;
                  if (!ops) {
                    ops = globalOpenings[room.id] || [];
                  }
                  
                  return ops.map((op, idx) => {
                    const opW = op.width;
                    let posX = 0, posZ = 0, rot = [0,0,0];
                    if (op.wall === 'front') {
                      posX = room.x + op.offset + opW / 2;
                      posZ = rz + d / 2 + 0.01;
                    } else if (op.wall === 'back') {
                      posX = room.x + op.offset + opW / 2;
                      posZ = rz - d / 2 - 0.01;
                      rot = [0, Math.PI, 0];
                    } else if (op.wall === 'left') {
                      posX = rx - w / 2 - 0.01;
                      posZ = room.y + op.offset + opW / 2;
                      rot = [0, -Math.PI / 2, 0];
                    } else if (op.wall === 'right') {
                      posX = rx + w / 2 + 0.01;
                      posZ = room.y + op.offset + opW / 2;
                      rot = [0, Math.PI / 2, 0];
                    }

                    if (op.type === 'door') {
                      const doorH = 2.2;
                      const posY = baseY + doorH / 2;
                      return <HighFiDoor key={idx} width={opW} height={doorH} position={[posX, posY, posZ]} rotation={rot} />;
                    } else {
                      const winH = wallH * 0.6;
                      const posY = baseY + 1.0 + winH / 2; // sill height ~1.0m
                      return <HighFiWindow key={idx} width={opW} height={winH} position={[posX, posY, posZ]} rotation={rot} />;
                    }
                  });
                })()}
              </group>
            )}

            {/* 6. Roof / Pergola / Parapet */}
            {(!isBalcony) ? (
              isTraditional ? (
                // Pitched Roof
                <mesh position={[rx, baseY + wallH, rz]} castShadow>
                  <coneGeometry args={[Math.max(w, d) * 0.75, 1.2, 4]} />
                  <meshStandardMaterial color="#8B4513" roughness={0.8} />
                </mesh>
              ) : (
                // Flat Roof / Parapet
                <group position={[rx, baseY + wallH + 0.15, rz]}>
                  <mesh castShadow receiveShadow>
                    <boxGeometry args={[w + 0.15, 0.3, d + 0.15]} />
                    <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
                  </mesh>
                  {/* If it's the top floor, maybe add a Pergola over part of it */}
                  {floorIdx === maxFloor && hash % 2 === 0 && w >= 3 && d >= 3 && (
                     <Pergola width={w - 0.5} depth={d - 0.5} position={[0, 0.3, 0]} />
                  )}
                </group>
              )
            ) : null}

          </group>
        );
      })}
    </group>
  );
}

// ─── TREES & PLANTS ──────────────────────────────────────────────────────────
function LowPolyTree({ position, scale = 1, variant = 0 }) {
  const foliageColors = ['#2d6a4f', '#40916c', '#52b788', '#1b4332', '#74c69d'];
  const trunkColors   = ['#8B5E3C', '#7c4b2a', '#6b4226'];
  const fc = foliageColors[variant % foliageColors.length];
  const tc = trunkColors[variant % trunkColors.length];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.13, 0.8, 6]} />
        <meshStandardMaterial color={tc} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <coneGeometry args={[0.56, 0.92, 7]} />
        <meshStandardMaterial color={fc} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.58, 0]} castShadow>
        <coneGeometry args={[0.38, 0.72, 7]} />
        <meshStandardMaterial color={foliageColors[(variant + 1) % foliageColors.length]} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.95, 0]} castShadow>
        <coneGeometry args={[0.22, 0.52, 7]} />
        <meshStandardMaterial color={foliageColors[(variant + 2) % foliageColors.length]} roughness={0.75} />
      </mesh>
    </group>
  );
}

function PalmTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[Math.sin(i * 0.12) * 0.08, 0.45 + i * 0.45, Math.cos(i * 0.08) * 0.04]} castShadow>
          <cylinderGeometry args={[0.07 - i * 0.008, 0.09 - i * 0.006, 0.5, 7]} />
          <meshStandardMaterial color="#8B6914" roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.62, 2.65, Math.sin(a) * 0.62]} rotation={[0.65, a, 0]} castShadow>
            <boxGeometry args={[0.06, 0.035, 1.2]} />
            <meshStandardMaterial color="#3d7a3d" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
}

function ShadeTree({ position, scale = 1, variant = 0 }) {
  const colors = ['#2d5a1b', '#3a7a28', '#4a9a35', '#1e4010'];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.6, 7]} />
        <meshStandardMaterial color="#6b4226" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.9, 8, 7]} />
        <meshStandardMaterial color={colors[variant % colors.length]} roughness={0.8} />
      </mesh>
      <mesh position={[0.4, 1.7, 0.3]} castShadow>
        <sphereGeometry args={[0.55, 7, 6]} />
        <meshStandardMaterial color={colors[(variant + 1) % colors.length]} roughness={0.8} />
      </mesh>
      <mesh position={[-0.4, 1.65, -0.2]} castShadow>
        <sphereGeometry args={[0.5, 7, 6]} />
        <meshStandardMaterial color={colors[(variant + 2) % colors.length]} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Bush({ position, scale = 1, color = '#3a7d44' }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 7]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.22, 0.18, 0.1]} castShadow>
        <sphereGeometry args={[0.2, 7, 6]} />
        <meshStandardMaterial color="#2d6a3a" roughness={0.85} />
      </mesh>
      <mesh position={[-0.2, 0.2, -0.08]} castShadow>
        <sphereGeometry args={[0.22, 7, 6]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
}

function FlowerBed({ position, scale = 1 }) {
  const flowerColors = ['#ec4899', '#f97316', '#eab308', '#a855f7', '#3b82f6', '#ef4444'];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[0.65, 0.65, 0.06, 12]} />
        <meshStandardMaterial color="#5c4a1e" roughness={1} />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 0.25 + (i % 3) * 0.12;
        return (
          <group key={i} position={[Math.cos(a) * r, 0.14, Math.sin(a) * r]}>
            <mesh>
              <cylinderGeometry args={[0.015, 0.015, 0.22, 4]} />
              <meshStandardMaterial color="#4a7a1a" />
            </mesh>
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.065, 6, 5]} />
              <meshStandardMaterial color={flowerColors[i % flowerColors.length]} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function SwimmingPool({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Pool Deck (4 borders to make it hollow) */}
      <mesh position={[-4.6, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.8, 0.3, 6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>
      <mesh position={[4.6, 0.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.8, 0.3, 6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.15, -2.6]} receiveShadow castShadow>
        <boxGeometry args={[8.4, 0.3, 0.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.15, 2.6]} receiveShadow castShadow>
        <boxGeometry args={[8.4, 0.3, 0.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
      </mesh>

      {/* Water Surface */}
      <mesh position={[0, 0.26, 0]} receiveShadow>
        <boxGeometry args={[8.4, 0.02, 4.4]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.05} metalness={0.9} />
      </mesh>
      {/* Water Volume (gives depth color) */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[8.4, 0.24, 4.4]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>
    </group>
  );
}

function Fountain({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.7, 0.65, 0.25, 18, 1, true]} />
        <meshStandardMaterial color="#c0c0c8" roughness={0.4} metalness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.06, 18]} />
        <meshStandardMaterial color="#d0d0d8" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 18]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.65} roughness={0.05} metalness={0.95} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 0.5, 8]} />
        <meshStandardMaterial color="#b0b0c0" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.1, 8, 7]} />
        <meshStandardMaterial color="#d8d8ea" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

function LampPost({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 2.5, 6]} />
        <meshStandardMaterial color="#2a2a38" roughness={0.4} metalness={0.9} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.14, 8, 7]} />
        <meshStandardMaterial color="#fffbea" emissive="#fffbea" emissiveIntensity={1.2} roughness={0.1} />
      </mesh>
      <pointLight position={[position[0], 2.55, position[2]]} intensity={0.8} distance={6} color="#fff5c0" />
    </group>
  );
}

function Car({ position, rotation = 0, color = '#ec4899' }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.9, 0.38, 0.88]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.7} />
      </mesh>
      <mesh position={[0.08, 0.52, 0]} castShadow>
        <boxGeometry args={[1.05, 0.32, 0.78]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0.09, 0.53, 0]}>
        <boxGeometry args={[0.9, 0.24, 0.72]} />
        <meshStandardMaterial color="#80d8ff" transparent opacity={0.45} roughness={0.05} metalness={0.95} />
      </mesh>
      {[[-0.65, -0.36], [0.65, -0.36], [-0.65, 0.36], [0.65, 0.36]].map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.13, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.13, 12]} />
          <meshStandardMaterial color="#111" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── SCENE ENVIRONMENT ───────────────────────────────────────────────────────
function GroundPlane({ plotSize, isApartment }) {
  return (
    <group>
      {/* Outer world */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={isApartment ? "#475569" : "#3d6b47"} roughness={1} />
      </mesh>
      
      {/* Paved plot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[plotSize, plotSize]} />
        <meshStandardMaterial color={isApartment ? "#64748b" : "#d6cdb8"} roughness={0.95} />
      </mesh>

      {/* Grass patches inside plot near corners (hide for apartments) */}
      {!isApartment && [
        [-plotSize * 0.32, 0, -plotSize * 0.32],
        [ plotSize * 0.32, 0, -plotSize * 0.32],
        [-plotSize * 0.32, 0,  plotSize * 0.32],
        [ plotSize * 0.32, 0,  plotSize * 0.32],
      ].map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={p} receiveShadow>
          <planeGeometry args={[plotSize * 0.18, plotSize * 0.18]} />
          <meshStandardMaterial color="#4a8a5a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function BoundaryWall({ plotSize }) {
  const hs = plotSize / 2;
  const h  = 1.2;
  const t  = 0.3;
  return (
    <group>
      {[
        { pos: [0, h / 2, -hs], scale: [plotSize, h, t] },
        { pos: [0, h / 2,  hs], scale: [plotSize, h, t] },
        { pos: [-hs, h / 2, 0], scale: [t, h, plotSize] },
        { pos: [ hs, h / 2, 0], scale: [t, h, plotSize] },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} castShadow receiveShadow>
          <boxGeometry args={w.scale} />
          <meshStandardMaterial color="#94a3b8" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, h + 0.15, -hs]}>
        <boxGeometry args={[3.2, 0.1, 0.1]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ─── PLACED ITEMS & INTERACTION ──────────────────────────────────────────────
function PlacedItems({ items }) {
  return (
    <>
      {items.map((item, i) => {
        const pos = [item.x, 0, item.z];
        switch (item.id) {
          case 'tree_pine':  return <LowPolyTree  key={item.uid || i} position={pos} scale={item.scale} variant={i} />;
          case 'tree_shade': return <ShadeTree    key={item.uid || i} position={pos} scale={item.scale} variant={i} />;
          case 'palm':       return <PalmTree     key={item.uid || i} position={pos} scale={item.scale} />;
          case 'bush':       return <Bush         key={item.uid || i} position={pos} scale={item.scale} color={item.color || '#3a7d44'} />;
          case 'flowers':    return <FlowerBed    key={item.uid || i} position={pos} scale={item.scale} />;
          case 'pool':       return <SwimmingPool key={item.uid || i} position={pos} rotation={item.rotation || 0} />;
          case 'fountain':   return <Fountain     key={item.uid || i} position={pos} />;
          case 'lamp':       return <LampPost     key={item.uid || i} position={pos} />;
          case 'car':        return <Car          key={item.uid || i} position={pos} rotation={item.rotation || 0} color={item.color || '#f0f0f0'} />;
          default:           return null;
        }
      })}
    </>
  );
}

function CameraPreset({ preset, trigger }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!trigger) return;
    const cfg = {
      isometric: { pos: [28, 22, 28], tgt: [0, 2, 0] },
      aerial:    { pos: [0,  38,  2], tgt: [0, 0, 0] },
      front:     { pos: [0,   6, 30], tgt: [0, 4, 0] },
      side:      { pos: [30,  6,  0], tgt: [0, 4, 0] },
      street:    { pos: [0,   2, 24], tgt: [0, 4, 0] },
    };
    const c = cfg[preset] || cfg.isometric;
    camera.position.set(...c.pos);
    camera.lookAt(...c.tgt);
    camera.updateProjectionMatrix();
  }, [trigger]);
  return null;
}

function PlacementGround({ active, onPlace, plotSize }) {
  const handleClick = (e) => {
    if (!active) return;
    e.stopPropagation();
    const hs = plotSize / 2 - 1.5;
    onPlace(Math.max(-hs, Math.min(hs, e.point.x)), Math.max(-hs, Math.min(hs, e.point.z)));
  };
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} onClick={handleClick}>
      <planeGeometry args={[plotSize, plotSize]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

const LANDSCAPE_CATALOG = {
  '🌳 Trees': [
    { id: 'tree_pine',  label: 'Pine Tree',      emoji: '🌲', scale: 2.0 },
    { id: 'palm',       label: 'Palm Tree',       emoji: '🌴', scale: 2.5 },
    { id: 'tree_shade', label: 'Shade / Mango',   emoji: '🌳', scale: 2.0 },
    { id: 'tree_shade', label: 'Large Banyan',    emoji: '🌳', scale: 3.5 },
  ],
  '🌸 Plants': [
    { id: 'bush',    label: 'Green Hedge',     emoji: '🌿', scale: 1.5, color: '#2d6a4f' },
    { id: 'bush',    label: 'Flowering Shrub', emoji: '🌺', scale: 1.2, color: '#7a3a6a' },
    { id: 'flowers', label: 'Flower Bed',      emoji: '🌸', scale: 1.5 },
    { id: 'flowers', label: 'Rose Garden',     emoji: '🌹', scale: 1.8 },
  ],
  '🏡 Garden': [
    { id: 'fountain', label: 'Fountain',      emoji: '⛲', scale: 1.0 },
    { id: 'lamp',     label: 'Garden Lamp',   emoji: '💡', scale: 1.0 },
  ],
  '🏊 Pools & Water': [
    { id: 'pool', label: 'Swimming Pool (H)', emoji: '🏊', scale: 1.0, rotation: 0 },
    { id: 'pool', label: 'Swimming Pool (V)', emoji: '🏊', scale: 1.0, rotation: Math.PI / 2 },
  ],
  '🚗 Vehicles': [
    { id: 'car', label: 'White Car',  emoji: '🚗', scale: 1.0, color: '#f5f5f5', rotation: 0 },
    { id: 'car', label: 'Red Car',    emoji: '🚗', scale: 1.0, color: '#cc2222', rotation: 0 },
    { id: 'car', label: 'Dark SUV',   emoji: '🚙', scale: 1.0, color: '#1a1a2e', rotation: Math.PI / 2 },
  ],
};

function KeyboardHandler({ onEsc }) {
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onEsc(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onEsc]);
  return null;
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function LandscapePreview({ floorPlan, preferences, onClose }) {
  const [placedItems,    setPlacedItems]    = useState([]);
  const [activeTool,     setActiveTool]     = useState(null);
  const [cameraPreset,   setCameraPreset]   = useState('isometric');
  const [presetTrigger,  setPresetTrigger]  = useState(0);
  const [showBoundary,   setShowBoundary]   = useState(true);
  const [timeOfDay,      setTimeOfDay]      = useState(14);

  const rooms    = floorPlan?.rooms || [];
  const style    = preferences?.style    || floorPlan?.style    || 'Modern';
  const homeType = preferences?.homeType || floorPlan?.homeType || '';
  const landArea = preferences?.landArea || floorPlan?.landArea || '';

  const isApartment = landArea.includes('Apartment') || landArea.includes('No Land');
  
  // Set initial plot size based on land area
  const [plotSize, setPlotSize] = useState(() => {
    if (isApartment) return 20; // minimal footprint
    if (landArea.includes('Compact')) return 26;
    if (landArea.includes('Medium')) return 36;
    if (landArea.includes('Large')) return 50;
    if (landArea.includes('Estate')) return 70;
    return 30; // default
  });

  const handlePlace = (x, z) => {
    if (!activeTool) return;
    setPlacedItems(prev => [...prev, { ...activeTool, x, z, uid: `${Date.now()}_${Math.random()}` }]);
  };

  const applyPreset = (p) => { setCameraPreset(p); setPresetTrigger(t => t + 1); };

  // Sun calculations
  const sunEl  = Math.max(0.05, Math.sin(((timeOfDay - 6) / 14) * Math.PI));
  const sunAz  = ((timeOfDay - 6) / 14) * 180;
  const sunPos = [
    Math.cos((sunAz * Math.PI) / 180) * 100,
    sunEl * 100,
    Math.sin((sunAz * Math.PI) / 180) * 100,
  ];

  const isDusk = timeOfDay < 8 || timeOfDay > 17;
  const sunLightColor = isDusk ? '#ffcfad' : '#ffffff';
  const ambIntensity  = 0.4 + sunEl * 0.4;
  const sunIntensity  = 1.2 + sunEl * 1.0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: '#06070d', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
    }}>

      {/* TOP BAR */}
      <div style={{
        height: '52px', flexShrink: 0, background: 'rgba(8,9,18,0.97)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem', gap: '1rem', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.25rem' }}>✨</span>
          <div>
            <div style={{
              fontWeight: '800', fontSize: '0.9rem',
              background: 'linear-gradient(90deg, #4ecdc4, #38bdf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Architectural 3D Viewer</div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>
              {isApartment ? 'Apartment View' : (activeTool ? `🎯 Placing: ${activeTool.label}` : 'Select an item to place it in the yard')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          {['isometric', 'aerial', 'front', 'side', 'street'].map(p => (
            <button key={p} onClick={() => applyPreset(p)} style={{
              padding: '4px 11px', borderRadius: '16px', cursor: 'pointer',
              border: cameraPreset === p ? '1px solid #4ecdc4' : '1px solid rgba(255,255,255,0.08)',
              background: cameraPreset === p ? 'rgba(78,205,196,0.14)' : 'rgba(255,255,255,0.03)',
              color: cameraPreset === p ? '#4ecdc4' : 'rgba(255,255,255,0.5)',
              fontSize: '0.7rem', fontWeight: '700', textTransform: 'capitalize'
            }}>{p}</button>
          ))}
        </div>

        <button onClick={onClose} style={{
          padding: '6px 18px', borderRadius: '20px',
          background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.35)',
          color: '#ec4899', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer',
        }}>✕ Exit</button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* CANVAS */}
        <div style={{ flex: 1, position: 'relative', cursor: activeTool ? 'crosshair' : 'grab' }}>
          <Canvas shadows camera={{ position: [28, 22, 28], fov: 46 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
            
            <Sky distance={450000} sunPosition={sunPos} turbidity={3} rayleigh={1.2} mieCoefficient={0.005} mieDirectionalG={0.8} />

            <ambientLight intensity={ambIntensity} color={isDusk ? '#ffe4cc' : '#ffffff'} />
            <directionalLight
              position={sunPos} intensity={sunIntensity}
              color={sunLightColor} castShadow
              shadow-mapSize-width={2048} shadow-mapSize-height={2048}
              shadow-bias={-0.0003} shadow-normalBias={0.02}
            />
            <hemisphereLight skyColor="#b1e1ff" groundColor="#4a7c59" intensity={0.4} />

            <GroundPlane plotSize={plotSize} isApartment={isApartment} />
            {showBoundary && !isApartment && <BoundaryWall plotSize={plotSize} />}

            <HouseExterior rooms={rooms} style={style} homeType={homeType} />
            {!isApartment && <PlacedItems items={placedItems} />}
            {!isApartment && <PlacementGround active={!!activeTool} onPlace={handlePlace} plotSize={plotSize - 2} />}
            
            <CameraPreset preset={cameraPreset} trigger={presetTrigger} />

            <OrbitControls
              enablePan enableZoom enableRotate
              maxPolarAngle={Math.PI * 0.85} minPolarAngle={0}
              minDistance={4} maxDistance={100}
              dampingFactor={0.05} enableDamping
              rotateSpeed={0.6} zoomSpeed={1.2}
              screenSpacePanning
            />
          </Canvas>
          
          {/* Helper Overlays */}
          {!activeTool && (
            <div style={{
              position: 'absolute', bottom: '1.4rem', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', background: 'rgba(6,7,13,0.75)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden', pointerEvents: 'none'
            }}>
              {['🖱 Orbit 360°', '↕ Zoom', '✋ Pan'].map((txt, i) => (
                <div key={i} style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  {txt}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{
          width: '280px', flexShrink: 0, background: 'rgba(9,10,20,0.97)', backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(78,205,196,0.1)', display: 'flex', flexDirection: 'column', overflowY: 'auto'
        }}>
          <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>

            {/* SCENE CONTROLS */}
            <section>
              <div style={{ fontSize: '0.62rem', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>Environment</div>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Time of Day</span>
                  <span style={{ color: '#4ecdc4', fontWeight: '700', fontFamily: 'monospace' }}>{timeOfDay}:00</span>
                </div>
                <input type="range" min={6} max={20} step={0.5} value={timeOfDay} onChange={e => setTimeOfDay(+e.target.value)} style={{ width: '100%', accentColor: '#4ecdc4' }} />
              </div>

              {!isApartment && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Plot Size</span>
                    <span style={{ color: '#ec4899', fontWeight: '700', fontFamily: 'monospace' }}>{plotSize}m × {plotSize}m</span>
                  </div>
                  <input type="range" min={20} max={80} step={2} value={plotSize} onChange={e => setPlotSize(+e.target.value)} style={{ width: '100%', accentColor: '#ec4899' }} />
                </div>
              )}

              {!isApartment && (
                <button onClick={() => setShowBoundary(p => !p)} style={{
                  padding: '5px 12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s',
                  border: showBoundary ? '1px solid #4ecdc4' : '1px solid rgba(255,255,255,0.1)',
                  background: showBoundary ? 'rgba(78,205,196,0.12)' : 'transparent',
                  color: showBoundary ? '#4ecdc4' : 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: '700',
                }}>🧱 Compound Wall</button>
              )}
            </section>

            {isApartment && (
              <div style={{ padding: '1rem', background: 'rgba(78,205,196,0.05)', borderRadius: '12px', border: '1px solid rgba(78,205,196,0.15)' }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🏙️</div>
                <div style={{ fontSize: '0.8rem', color: '#4ecdc4', fontWeight: 'bold', marginBottom: '4px' }}>Apartment Mode Active</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Garden decoration is disabled since no land area was selected.</div>
              </div>
            )}

            {!isApartment && <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />}

            {/* GARDEN DECORATOR */}
            {!isApartment && (
              <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem' }}>Decorator</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px' }}>
                  {Object.entries(LANDSCAPE_CATALOG).map(([catName, items]) => (
                    <div key={catName}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#4ecdc4', marginBottom: '8px', borderBottom: '1px solid rgba(78,205,196,0.2)', paddingBottom: '4px' }}>
                        {catName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {items.map((item, i) => {
                          const isActive = activeTool?.label === item.label;
                          return (
                            <button key={i} onClick={() => setActiveTool(isActive ? null : item)} style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                              padding: '12px 6px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                              border: isActive ? '2px solid #4ecdc4' : '1px solid rgba(255,255,255,0.06)',
                              background: isActive ? 'rgba(78,205,196,0.15)' : 'rgba(255,255,255,0.03)',
                            }}>
                              <span style={{ fontSize: '1.8rem' }}>{item.emoji}</span>
                              <span style={{ fontSize: '0.65rem', fontWeight: '700', color: isActive ? '#4ecdc4' : 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!isApartment && <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />}

            {/* PLACED ITEMS */}
            {!isApartment && (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Placed</div>
                  {placedItems.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setPlacedItems(p => p.slice(0, -1))} style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', cursor: 'pointer' }}>Undo</button>
                      <button onClick={() => setPlacedItems([])} style={{ padding: '3px 8px', borderRadius: '6px', border: 'none', background: 'rgba(236,72,153,0.15)', color: '#ec4899', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}>Clear</button>
                    </div>
                  )}
                </div>
                
                {placedItems.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '1rem 0' }}>No items placed</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '180px', overflowY: 'auto' }}>
                    {[...placedItems].reverse().map(item => (
                      <div key={item.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                        <span>{item.emoji}</span>
                        <span style={{ flex: 1, fontWeight: '600' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
      <KeyboardHandler onEsc={() => setActiveTool(null)} />
    </div>
  );
}
