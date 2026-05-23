/**
 * Agni AI — DXF Exporter Utility
 * Generates an ASCII DXF file of the 2D floor plan layout
 * Compatible with AutoCAD, SolidWorks, and other CAD editors
 */

export function exportToDXF(floorPlan, options = {}) {
  const { unit = 'm' } = options; // 'm' for meters, 'ft' for feet
  
  // Conversion factor from meters (internal representation)
  const scale = 1.0; 
  
  let dxf = [];
  
  // 1. HEADER SECTION
  dxf.push("  0", "SECTION");
  dxf.push("  2", "HEADER");
  dxf.push("  9", "$ACADVER");
  dxf.push("  1", "AC1015"); // AutoCAD 2000 format, highly compatible
  dxf.push("  9", "$INSUNITS");
  dxf.push(" 70", unit === 'ft' ? "2" : "6"); // 2 = feet, 6 = meters
  dxf.push("  0", "ENDSEC");

  // 2. TABLES SECTION (Layers configuration)
  dxf.push("  0", "SECTION");
  dxf.push("  2", "TABLES");
  dxf.push("  0", "TABLE");
  dxf.push("  2", "LAYER");
  dxf.push(" 70", "7"); // Number of layers
  
  // Layer details: [Name, ColorCode]
  // Color codes: 1=Red, 2=Yellow, 3=Green, 4=Cyan, 5=Blue, 6=Magenta, 7=White/Black
  const layers = [
    { name: "WALLS_OUTER", color: 7 }, // White
    { name: "WALLS_INNER", color: 251 }, // Dark Grey
    { name: "DOORS", color: 4 },       // Cyan
    { name: "WINDOWS", color: 3 },     // Green
    { name: "FURNITURE", color: 1 },   // Red
    { name: "DIMENSIONS", color: 2 },  // Yellow
    { name: "ANNOTATIONS", color: 6 }  // Magenta
  ];

  layers.forEach(layer => {
    dxf.push("  0", "LAYER");
    dxf.push("  5", "AA" + layer.color);
    dxf.push("100", "AcDbSymbolTableRecord");
    dxf.push("100", "AcDbLayerTableRecord");
    dxf.push("  2", layer.name);
    dxf.push(" 70", "0");
    dxf.push(" 62", String(layer.color)); // Color index
    dxf.push("  6", "CONTINUOUS");        // Linetype
  });
  dxf.push("  0", "ENDTAB");
  dxf.push("  0", "ENDSEC");

  // 3. ENTITIES SECTION
  dxf.push("  0", "SECTION");
  dxf.push("  2", "ENTITIES");

  // Helper functions to append entities
  const addLine = (x1, y1, x2, y2, layer) => {
    dxf.push("  0", "LINE");
    dxf.push("  8", layer);
    dxf.push(" 10", (x1 * scale).toFixed(4));
    dxf.push(" 20", (y1 * scale).toFixed(4));
    dxf.push(" 30", "0.0");
    dxf.push(" 11", (x2 * scale).toFixed(4));
    dxf.push(" 21", (y2 * scale).toFixed(4));
    dxf.push(" 31", "0.0");
  };

  const addText = (x, y, text, height, angle = 0, layer = "ANNOTATIONS") => {
    dxf.push("  0", "TEXT");
    dxf.push("  8", layer);
    dxf.push(" 10", (x * scale).toFixed(4));
    dxf.push(" 20", (y * scale).toFixed(4));
    dxf.push(" 30", "0.0");
    dxf.push(" 40", height.toFixed(4));
    dxf.push("  1", text);
    if (angle !== 0) {
      dxf.push(" 50", angle.toFixed(4)); // Rotation angle in degrees
    }
  };

  const addArc = (cx, cy, radius, startAngle, endAngle, layer = "DOORS") => {
    dxf.push("  0", "ARC");
    dxf.push("  8", layer);
    dxf.push(" 10", (cx * scale).toFixed(4));
    dxf.push(" 20", (cy * scale).toFixed(4));
    dxf.push(" 30", "0.0");
    dxf.push(" 40", radius.toFixed(4));
    dxf.push(" 50", startAngle.toFixed(4)); // Degrees
    dxf.push(" 60", endAngle.toFixed(4));   // Degrees
  };

  // 4. GENERATING GEOMETRY
  if (floorPlan && floorPlan.rooms) {
    floorPlan.rooms.forEach(room => {
      const { x, y, width, height: depth, name } = room;
      const t = 0.20; // Default Wall thickness = 200mm
      
      // Ensure openings exist
      const openings = room.openings || [
        { type: 'door', wall: 'front', offset: 0.5, width: 0.9 },
        { type: 'window', wall: 'back', offset: Math.max(0.5, width / 2 - 0.6), width: Math.min(width - 1.0, 1.2) }
      ];

      // ABSOLUTE CORNERS OF THE ROOM
      // Bottom-Left (BL), Bottom-Right (BR), Top-Right (TR), Top-Left (TL)
      const xBL = x;       const yBL = y;
      const xBR = x + width; const yBR = y;
      const xTR = x + width; const yTR = y + depth;
      const xTL = x;       const yTL = y + depth;

      // Draw Room Label Tag
      addText(x + width / 2 - 0.5, y + depth / 2, name, 0.25, 0, "ANNOTATIONS");
      const unitLabel = unit === 'ft' 
        ? `${(width * 3.28084).toFixed(1)}' x ${(depth * 3.28084).toFixed(1)}'`
        : `${width.toFixed(2)}m x ${depth.toFixed(2)}m`;
      addText(x + width / 2 - 0.5, y + depth / 2 - 0.3, unitLabel, 0.16, 0, "ANNOTATIONS");

      // PROCESS FOUR WALLS (Outer and Inner Lines, cutting gaps for doors & windows)
      const processWall = (wallName, p1_out, p2_out, p1_in, p2_in, directionVec) => {
        // Filter openings on this wall
        const wallOpenings = openings.filter(o => o.wall === wallName);
        
        if (wallOpenings.length === 0) {
          // Continuous Wall
          addLine(p1_out.x, p1_out.y, p2_out.x, p2_out.y, "WALLS_OUTER");
          addLine(p1_in.x, p1_in.y, p2_in.x, p2_in.y, "WALLS_INNER");
          return;
        }

        // Sort openings by offset
        wallOpenings.sort((a, b) => a.offset - b.offset);

        // Track current pointer along the wall (0 to 1 scale or absolute distance)
        let currDist_out = 0;
        let currDist_in = 0;

        const wallLengthOuter = Math.sqrt(Math.pow(p2_out.x - p1_out.x, 2) + Math.pow(p2_out.y - p1_out.y, 2));
        const wallLengthInner = Math.sqrt(Math.pow(p2_in.x - p1_in.x, 2) + Math.pow(p2_in.y - p1_in.y, 2));

        wallOpenings.forEach(opening => {
          const { type, offset, width: opWidth } = opening;
          
          // Absolute coordinates of the opening start and end on Outer wall
          const tStart_out = offset / wallLengthOuter;
          const tEnd_out = (offset + opWidth) / wallLengthOuter;

          const opStart_out = {
            x: p1_out.x + (p2_out.x - p1_out.x) * tStart_out,
            y: p1_out.y + (p2_out.y - p1_out.y) * tStart_out
          };
          const opEnd_out = {
            x: p1_out.x + (p2_out.x - p1_out.x) * tEnd_out,
            y: p1_out.y + (p2_out.y - p1_out.y) * tEnd_out
          };

          // Absolute coordinates of opening on Inner wall
          // Inner wall length differs slightly at corners, adjust offset proportionally
          const innerOffset = offset * (wallLengthInner / wallLengthOuter);
          const innerOpWidth = opWidth * (wallLengthInner / wallLengthOuter);
          const tStart_in = innerOffset / wallLengthInner;
          const tEnd_in = (innerOffset + innerOpWidth) / wallLengthInner;

          const opStart_in = {
            x: p1_in.x + (p2_in.x - p1_in.x) * tStart_in,
            y: p1_in.y + (p2_in.y - p1_in.y) * tStart_in
          };
          const opEnd_in = {
            x: p1_in.x + (p2_in.x - p1_in.x) * tEnd_in,
            y: p1_in.y + (p2_in.y - p1_in.y) * tEnd_in
          };

          // 1. Draw solid wall segments up to the opening
          if (offset > currDist_out) {
            const segStart_out = {
              x: p1_out.x + (p2_out.x - p1_out.x) * (currDist_out / wallLengthOuter),
              y: p1_out.y + (p2_out.y - p1_out.y) * (currDist_out / wallLengthOuter)
            };
            addLine(segStart_out.x, segStart_out.y, opStart_out.x, opStart_out.y, "WALLS_OUTER");
          }
          if (innerOffset > currDist_in) {
            const segStart_in = {
              x: p1_in.x + (p2_in.x - p1_in.x) * (currDist_in / wallLengthInner),
              y: p1_in.y + (p2_in.y - p1_in.y) * (currDist_in / wallLengthInner)
            };
            addLine(segStart_in.x, segStart_in.y, opStart_in.x, opStart_in.y, "WALLS_INNER");
          }

          // 2. Draw the opening itself
          if (type === 'window') {
            // Draw window end caps
            addLine(opStart_out.x, opStart_out.y, opStart_in.x, opStart_in.y, "WINDOWS");
            addLine(opEnd_out.x, opEnd_out.y, opEnd_in.x, opEnd_in.y, "WINDOWS");
            // Draw double-glazing lines
            const mid1 = {
              x: opStart_out.x + (opStart_in.x - opStart_out.x) * 0.35,
              y: opStart_out.y + (opStart_in.y - opStart_out.y) * 0.35
            };
            const mid2 = {
              x: opStart_out.x + (opStart_in.x - opStart_out.x) * 0.65,
              y: opStart_out.y + (opStart_in.y - opStart_out.y) * 0.65
            };
            const mid1_end = {
              x: opEnd_out.x + (opEnd_in.x - opEnd_out.x) * 0.35,
              y: opEnd_out.y + (opEnd_in.y - opEnd_out.y) * 0.35
            };
            const mid2_end = {
              x: opEnd_out.x + (opEnd_in.x - opEnd_out.x) * 0.65,
              y: opEnd_out.y + (opEnd_in.y - opEnd_out.y) * 0.65
            };
            addLine(mid1.x, mid1.y, mid1_end.x, mid1_end.y, "WINDOWS");
            addLine(mid2.x, mid2.y, mid2_end.x, mid2_end.y, "WINDOWS");
          } else if (type === 'door') {
            // Draw door jamb caps
            addLine(opStart_out.x, opStart_out.y, opStart_in.x, opStart_in.y, "DOORS");
            addLine(opEnd_out.x, opEnd_out.y, opEnd_in.x, opEnd_in.y, "DOORS");

            // Draw Door panel (swinging out 90 degrees)
            // Let's assume swing direction matches the wall axis
            let panelEnd = { x: 0, y: 0 };
            let startAngle = 0;
            let endAngle = 0;

            if (wallName === 'front') {
              // Swing upwards: pivot is opStart_out
              panelEnd = { x: opStart_out.x, y: opStart_out.y + opWidth };
              startAngle = 0;
              endAngle = 90;
              addLine(opStart_out.x, opStart_out.y, panelEnd.x, panelEnd.y, "DOORS");
              addArc(opStart_out.x, opStart_out.y, opWidth, startAngle, endAngle, "DOORS");
            } else if (wallName === 'back') {
              // Swing downwards: pivot is opStart_out
              panelEnd = { x: opStart_out.x, y: opStart_out.y - opWidth };
              startAngle = 270;
              endAngle = 360;
              addLine(opStart_out.x, opStart_out.y, panelEnd.x, panelEnd.y, "DOORS");
              addArc(opStart_out.x, opStart_out.y, opWidth, startAngle, endAngle, "DOORS");
            } else if (wallName === 'left') {
              // Swing leftwards: pivot is opStart_out
              panelEnd = { x: opStart_out.x - opWidth, y: opStart_out.y };
              startAngle = 90;
              endAngle = 180;
              addLine(opStart_out.x, opStart_out.y, panelEnd.x, panelEnd.y, "DOORS");
              addArc(opStart_out.x, opStart_out.y, opWidth, startAngle, endAngle, "DOORS");
            } else if (wallName === 'right') {
              // Swing rightwards: pivot is opStart_out
              panelEnd = { x: opStart_out.x + opWidth, y: opStart_out.y };
              startAngle = 270;
              endAngle = 90; // spans 270 to 360/0 to 90
              addLine(opStart_out.x, opStart_out.y, panelEnd.x, panelEnd.y, "DOORS");
              addArc(opStart_out.x, opStart_out.y, opWidth, 0, 90, "DOORS");
            }
          }

          // Advance pointer
          currDist_out = offset + opWidth;
          currDist_in = innerOffset + innerOpWidth;
        });

        // 3. Draw final remaining segment of the wall
        if (wallLengthOuter > currDist_out) {
          const lastSeg_out = {
            x: p1_out.x + (p2_out.x - p1_out.x) * (currDist_out / wallLengthOuter),
            y: p1_out.y + (p2_out.y - p1_out.y) * (currDist_out / wallLengthOuter)
          };
          addLine(lastSeg_out.x, lastSeg_out.y, p2_out.x, p2_out.y, "WALLS_OUTER");
        }
        if (wallLengthInner > currDist_in) {
          const lastSeg_in = {
            x: p1_in.x + (p2_in.x - p1_in.x) * (currDist_in / wallLengthInner),
            y: p1_in.y + (p2_in.y - p1_in.y) * (currDist_in / wallLengthInner)
          };
          addLine(lastSeg_in.x, lastSeg_in.y, p2_in.x, p2_in.y, "WALLS_INNER");
        }
      };

      // Define Wall Segments (Outer vs Inner)
      // Back wall: BL to BR
      processWall(
        'back',
        { x: xBL, y: yBL },
        { x: xBR, y: yBR },
        { x: xBL + t, y: yBL + t },
        { x: xBR - t, y: yBR + t },
        { x: 1, y: 0 }
      );
      
      // Right wall: BR to TR
      processWall(
        'right',
        { x: xBR, y: yBR },
        { x: xTR, y: yTR },
        { x: xBR - t, y: yBR + t },
        { x: xTR - t, y: yTR - t },
        { x: 0, y: 1 }
      );

      // Front wall: TR to TL
      processWall(
        'front',
        { x: xTR, y: yTR },
        { x: xTL, y: yTL },
        { x: xTR - t, y: yTR - t },
        { x: xTL + t, y: yTL - t },
        { x: -1, y: 0 }
      );

      // Left wall: TL to BL
      processWall(
        'left',
        { x: xTL, y: yTL },
        { x: xBL, y: yBL },
        { x: xTL + t, y: yTL - t },
        { x: xBL + t, y: yBL + t },
        { x: 0, y: -1 }
      );

      // 5. DIMENSION ANNOTATIONS
      // Outer dimension indicators around the room boundary
      // Bottom outer dimension
      addLine(xBL, yBL - 0.4, xBR, yBR - 0.4, "DIMENSIONS");
      addLine(xBL, yBL - 0.35, xBL, yBL - 0.45, "DIMENSIONS");
      addLine(xBR, yBR - 0.35, xBR, yBR - 0.45, "DIMENSIONS");
      const dimLabelBottom = unit === 'ft' ? `${(width * 3.28084).toFixed(1)}'` : `${width.toFixed(2)}m`;
      addText(x + width / 2 - 0.2, y - 0.35, dimLabelBottom, 0.15, 0, "DIMENSIONS");

      // Left outer dimension
      addLine(xBL - 0.4, yBL, xTL - 0.4, yTL, "DIMENSIONS");
      addLine(xBL - 0.35, yBL, xBL - 0.45, yBL, "DIMENSIONS");
      addLine(xTL - 0.35, yTL, xTL - 0.45, yTL, "DIMENSIONS");
      const dimLabelLeft = unit === 'ft' ? `${(depth * 3.28084).toFixed(1)}'` : `${depth.toFixed(2)}m`;
      addText(x - 0.35, y + depth / 2 - 0.2, dimLabelLeft, 0.15, 90, "DIMENSIONS");

      // 6. FURNITURE LAYER
      // If room contains decorative furniture layout representations
      if (room.name.toLowerCase().includes('bedroom') || room.name.toLowerCase().includes('bed')) {
        // Draw bed box
        const bx1 = x + t + 0.3;
        const by1 = y + t + 0.3;
        const bw = 1.6;
        const bh = 2.0;
        addLine(bx1, by1, bx1 + bw, by1, "FURNITURE");
        addLine(bx1 + bw, by1, bx1 + bw, by1 + bh, "FURNITURE");
        addLine(bx1 + bw, by1 + bh, bx1, by1 + bh, "FURNITURE");
        addLine(bx1, by1 + bh, bx1, by1, "FURNITURE");
        // Pillows
        addLine(bx1 + 0.2, by1 + bh - 0.5, bx1 + 0.7, by1 + bh - 0.5, "FURNITURE");
        addLine(bx1 + 0.9, by1 + bh - 0.5, bx1 + 1.4, by1 + bh - 0.5, "FURNITURE");
      } else if (room.name.toLowerCase().includes('living')) {
        // Sofa representation
        const sx = x + t + 0.4;
        const sy = y + t + 0.4;
        const sw = 2.4;
        const sd = 0.85;
        // Main box
        addLine(sx, sy, sx + sw, sy, "FURNITURE");
        addLine(sx + sw, sy, sx + sw, sy + sd, "FURNITURE");
        addLine(sx + sw, sy + sd, sx, sy + sd, "FURNITURE");
        addLine(sx, sy + sd, sx, sy, "FURNITURE");
      } else if (room.name.toLowerCase().includes('kitchen')) {
        // Countertop
        const cx1 = x + t;
        const cy1 = y + t;
        addLine(cx1, cy1, cx1 + width - 2 * t, cy1, "FURNITURE");
        addLine(cx1 + width - 2 * t, cy1, cx1 + width - 2 * t, cy1 + 0.7, "FURNITURE");
        addLine(cx1 + width - 2 * t, cy1 + 0.7, cx1 + 0.7, cy1 + 0.7, "FURNITURE");
        addLine(cx1 + 0.7, cy1 + 0.7, cx1 + 0.7, cy1 + depth - 2 * t, "FURNITURE");
        addLine(cx1 + 0.7, cy1 + depth - 2 * t, cx1, cy1 + depth - 2 * t, "FURNITURE");
      }
    });
  }

  // 5. CLOSING SECTIONS
  dxf.push("  0", "ENDSEC");
  dxf.push("  0", "EOF");

  return dxf.join("\r\n");
}

export function downloadDXF(floorPlan, projectName = 'Agni_AI_Floorplan', options = {}) {
  const dxfContent = exportToDXF(floorPlan, options);
  const blob = new Blob([dxfContent], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName.replace(/\s+/g, '_')}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
