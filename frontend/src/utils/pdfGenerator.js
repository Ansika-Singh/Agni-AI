import { jsPDF } from 'jspdf';

/**
 * Agni AI — PDF Generator Utility
 * Exports canvas drawing sheets and itemized contractor reports
 */

// Format currency in Indian Rupees format (e.g. ₹1,50,000)
const formatRupees = (value) => {
  const num = Math.round(value);
  return '₹' + num.toLocaleString('en-IN');
};

/**
 * 1. Exports a high-res blueprint sheet in A3 landscape layout with a classic Title Block.
 */
export function exportBlueprintPDF({ canvas, floorPlan, viewMode, activeFloor, vastuScore, facing = 'East' }) {
  if (!canvas) {
    console.error("Canvas element not found for PDF export.");
    return;
  }

  // Get image data from Three.js canvas
  const imgData = canvas.toDataURL('image/png');

  // Create A3 landscape PDF (420mm x 297mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });

  const pageWidth = 420;
  const pageHeight = 297;

  // 1. Draw a dark navy-blue background for the entire sheet (classic Blueprint look)
  doc.setFillColor(11, 26, 48); // #0b1a30
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Draw border lines
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner thin accent line
  doc.setDrawColor(78, 205, 196); // #4ecdc4 (Teal)
  doc.setLineWidth(0.2);
  doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

  // 3. Draw the canvas screenshot centered on the blueprint
  // Subtracting space for the title block at the bottom
  const renderWidth = pageWidth - 40;
  const renderHeight = pageHeight - 80;
  doc.addImage(imgData, 'PNG', 20, 20, renderWidth, renderHeight);

  // 4. DRAW THE PROFESSIONAL ARCHITECTURAL TITLE BLOCK (Bottom right corner)
  const tbWidth = 140;
  const tbHeight = 45;
  const tbX = pageWidth - tbWidth - 15;
  const tbY = pageHeight - tbHeight - 15;

  // Fill title block container
  doc.setFillColor(10, 11, 18); // Dark charcoal
  doc.rect(tbX, tbY, tbWidth, tbHeight, 'F');
  doc.setDrawColor(236, 72, 153); // Hot Pink border
  doc.setLineWidth(0.6);
  doc.rect(tbX, tbY, tbWidth, tbHeight);

  // Subdivisions inside Title Block
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  // Vertical divider at x = tbX + 80
  doc.line(tbX + 80, tbY, tbX + 80, tbY + tbHeight);
  // Horizontal divider at y = tbY + 25
  doc.line(tbX, tbY + 25, tbX + 80, tbY + 25);
  
  // Left-Top Block: Project Details
  doc.setTextColor(236, 72, 153);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AGNI AI ARCHITECTS', tbX + 5, tbY + 8);
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('PROJECT:', tbX + 5, tbY + 14);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(floorPlan.title?.toUpperCase() || '2BHK HOME PLAN', tbX + 5, tbY + 18);

  // Left-Bottom Block: Scale and Date
  doc.setTextColor(200, 200, 200);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('DATE', tbX + 5, tbY + 31);
  doc.text('SCALE', tbX + 45, tbY + 31);
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString(), tbX + 5, tbY + 37);
  doc.text('1:100 (GF Snapped)', tbX + 45, tbY + 37);

  // Right Block: Design Parameters & Vastu
  doc.setTextColor(236, 72, 153);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TECHNICAL SPECS', tbX + 85, tbY + 8);
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`FACING: ${facing.toUpperCase()}`, tbX + 85, tbY + 15);
  doc.text(`ACTIVE VIEW: ${viewMode === '2D' ? 'BLUEPRINT 2D' : '3D PERSPECTIVE'}`, tbX + 85, tbY + 20);
  doc.text(`FLOOR ISOLATION: ${activeFloor === 'all' ? 'ALL FLOORS' : `LEVEL ${activeFloor}`}`, tbX + 85, tbY + 25);
  
  doc.setDrawColor(0, 230, 118);
  doc.setFillColor(0, 230, 118, 0.1);
  doc.rect(tbX + 85, tbY + 29, 50, 11, 'DF');
  
  doc.setTextColor(0, 230, 118);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`VASTU COMPLIANCE: ${vastuScore}%`, tbX + 89, tbY + 36);

  // Download PDF
  const filename = `${(floorPlan.title || 'Agni_AI_Blueprint').replace(/\s+/g, '_')}_Blueprint.pdf`;
  doc.save(filename);
}

/**
 * 2. Generates an itemized contractor quotation sheet based on room sizing and finishes quality.
 */
export function exportEstimatePDF({ floorPlan, quality = 'Standard' }) {
  if (!floorPlan || !floorPlan.rooms) {
    console.error("Floor plan data missing for Cost Estimate.");
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pw = 210; // Page width
  
  // Set rates per square meter (approximate Indian contractor values)
  // 1 sq meter = ~10.76 sq ft
  const rates = {
    Budget: {
      construction: 16000, // per sq m (~1500 / sqft)
      flooring: 900,      // Ceramic tile / basic vitrified (~80 / sqft)
      painting: 350,      // Distemper / Basic Acrylic
      ceiling: 650,       // basic sheet
      electrical: 800,    // per point / area
      plumbing: 1200      // per point / wet room area
    },
    Standard: {
      construction: 24000, // per sq m (~2200 / sqft)
      flooring: 1800,     // Double charge vitrified / wood laminates
      painting: 600,      // Plastic emulsion / royal satin
      ceiling: 1100,      // Gypsum false ceiling with LED slots
      electrical: 1400,
      plumbing: 2200
    },
    Premium: {
      construction: 38000, // per sq m (~3500 / sqft)
      flooring: 4500,     // Italian marble / teak hardwood
      painting: 1200,     // Luxury texture coatings / imported wallpapers
      ceiling: 2200,      // Intricate wood + gypsum design panels
      electrical: 3000,
      plumbing: 5000
    }
  };

  const rateSet = rates[quality];
  
  // Draw header block
  doc.setFillColor(13, 17, 34); // #0d1122
  doc.rect(0, 0, pw, 45, 'F');
  
  doc.setTextColor(236, 72, 153); // Pink
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AGNI AI CONSTRUCTIONS', 15, 18);
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('PRECISE CLIENT ESTIMATION SHEET · CONTRACTOR COOPERATIVE', 15, 24);

  // Project details in Header
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.text(`PROJECT TITLE: ${floorPlan.title?.toUpperCase() || 'DREAM RESIDENCE'}`, 15, 34);
  doc.text(`SPECIFICATION FINISH: ${quality.toUpperCase()} CLASS`, 15, 39);
  doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, pw - 75, 39);

  // Calculations & Columns Layout
  let y = 58;
  doc.setTextColor(13, 17, 34);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ITEMIZED WORK ORDER BREAKDOWN', 15, y);
  
  y += 6;
  doc.setDrawColor(236, 72, 153);
  doc.setLineWidth(0.5);
  doc.line(15, y, pw - 15, y);

  // Table Headers
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('ROOM NAME / WORK ITEM', 16, y);
  doc.text('AREA (SQ.M)', 85, y);
  doc.text('UNIT CATEGORY', 115, y);
  doc.text('RATE/SQ.M', 150, y);
  doc.text('SUBTOTAL', 180, y);

  y += 3;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(15, y, pw - 15, y);

  let grandTotal = 0;
  let totalArea = 0;

  floorPlan.rooms.forEach((room, idx) => {
    const { name, width, height: depth } = room;
    const area = width * depth;
    totalArea += area;

    // We'll group costs per room for neat printing
    y += 7;
    
    // Page break protection
    if (y > 260) {
      doc.addPage();
      y = 25;
      // Re-draw standard thin header on new page
      doc.setFillColor(13, 17, 34);
      doc.rect(0, 0, pw, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(`ESTIMATE CONTINUED — ${floorPlan.title || 'DREAM HOME'}`, 15, 10);
      y += 10;
    }

    doc.setTextColor(13, 17, 34);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${idx + 1}. ${name.toUpperCase()}`, 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${area.toFixed(1)} sqm`, 85, y);

    // Cost 1: Basic Structure Construction (Slabs, pillars, plastering)
    const structCost = area * rateSet.construction;
    y += 5;
    doc.setTextColor(80, 80, 80);
    doc.text('   - RCC Slab & Brick Walls', 15, y);
    doc.text('Structure', 115, y);
    doc.text(formatRupees(rateSet.construction), 150, y);
    doc.text(formatRupees(structCost), 180, y);

    // Cost 2: Flooring Finishes
    const flooringCost = area * rateSet.flooring;
    y += 4.5;
    doc.text('   - Floor Finishes', 15, y);
    doc.text('Flooring', 115, y);
    doc.text(formatRupees(rateSet.flooring), 150, y);
    doc.text(formatRupees(flooringCost), 180, y);

    // Cost 3: Ceiling plastering / Gypsum ceiling
    const ceilingCost = area * rateSet.ceiling;
    y += 4.5;
    doc.text('   - False Ceiling & Lighting Grid', 15, y);
    doc.text('Ceiling', 115, y);
    doc.text(formatRupees(rateSet.ceiling), 150, y);
    doc.text(formatRupees(ceilingCost), 180, y);

    // Cost 4: Wall paint surface coating (estimating wall surface = area * 1.5 approx)
    const wallPaintCost = area * 1.5 * rateSet.painting;
    y += 4.5;
    doc.text('   - Wall Plastering & Emulsion Paint', 15, y);
    doc.text('Painting', 115, y);
    doc.text(formatRupees(rateSet.painting), 150, y);
    doc.text(formatRupees(wallPaintCost), 180, y);

    // Accumulate room total
    const roomTotal = structCost + flooringCost + ceilingCost + wallPaintCost;
    grandTotal += roomTotal;
    
    y += 4.5;
    doc.setDrawColor(240, 240, 240);
    doc.line(20, y, pw - 15, y);
  });

  // 7. SUMMARY BOX (Bottom or Next Page)
  y += 10;
  if (y > 230) {
    doc.addPage();
    y = 30;
  }

  // Draw Summary layout box
  doc.setFillColor(248, 249, 250); // Light silver
  doc.rect(15, y, pw - 30, 48, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.rect(15, y, pw - 30, 48);

  const gst = grandTotal * 0.18; // 18% GST standard in Indian building works
  const finalEstimate = grandTotal + gst;

  doc.setTextColor(13, 17, 34);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ESTIMATE COST SUMMARY SUMMARY', 20, y + 8);
  doc.setLineWidth(0.2);
  doc.line(20, y + 10, pw - 20, y + 10);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Carpet Surface Area: ${totalArea.toFixed(2)} Sq. Meters (~${(totalArea * 10.7639).toFixed(0)} Sq. Feet)`, 20, y + 16);
  doc.text(`Subtotal Structural & Interior Works:`, 20, y + 22);
  doc.text(formatRupees(grandTotal), pw - 50, y + 22);

  doc.text(`GST Construction Levy (18%):`, 20, y + 28);
  doc.text(formatRupees(gst), pw - 50, y + 28);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(236, 72, 153); // Agni pink
  doc.text(`GRAND CONTRACT TOTAL FOR QUOTE:`, 20, y + 38);
  doc.text(formatRupees(finalEstimate), pw - 50, y + 38);

  // Footer terms
  y += 58;
  doc.setTextColor(140, 140, 140);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('DISCLAIMER: This document serves as a rule-of-thumb civil estimate generated automatically based on basic room boundaries.', 15, y);
  doc.text('Actual construction costs may differ due to local labor conditions, steel price indices, and precise sub-soil loading factors.', 15, y + 4);
  doc.text('Generated via Agni AI CAD Engine — Authorized and signed client copy.', 15, y + 8);

  // Download PDF
  const filename = `${(floorPlan.title || 'Agni_AI_Estimate').replace(/\s+/g, '_')}_Estimate_${quality}.pdf`;
  doc.save(filename);
}
