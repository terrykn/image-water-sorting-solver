/* ------------------------------------------------------
   CONFIGURATION: HARDCODED POSITIONS
   ------------------------------------------------------ */
// The X coordinates for the 4 columns
const COLS_X = [170, 444, 726, 1003];

// The Y starting coordinates for the 3 rows (Top to Bottom visually)
// We need to keep this order for scanning simplicity:
// Index 0: Row 3 (Visual Top)
// Index 1: Row 2 (Visual Mid)
// Index 2: Row 1 (Visual Bottom)
const ROWS_Y = [635, 1125, 1635]; 

// The offsets from the top of the tube to each of the 4 slots
const SLOT_OFFSETS = [0, 83, 166, 250];

// YOUR ORIGINAL COLORS (The 'colorMap' for the App)
const LIQUID_COLORS = [
  { id: 0, hex: "#ffdd52", rgb: [255, 221, 82] },
  { id: 1, hex: "#69d7ff", rgb: [105, 215, 255] },
  { id: 2, hex: "#f34cff", rgb: [243, 76, 255] },
  { id: 3, hex: "#ffa540", rgb: [255, 165, 64] },
  { id: 4, hex: "#5d5bff", rgb: [93, 91, 255] },
  { id: 5, hex: "#77ff64", rgb: [119, 255, 100] },
  { id: 6, hex: "#fe4f4d", rgb: [254, 79, 77] }
];

// Colors to explicitly ignore (backgrounds, shadows)
const AVOID_COLORS = [
  [113, 193, 241],
  [53, 97, 171], 
  [17, 29, 50]   
];

/* ------------------------------------------------------
   HELPER FUNCTIONS
   ------------------------------------------------------ */

const colorDist = (c1, c2) => {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
};

const classifyPixel = (r, g, b) => {
  const pixel = [r, g, b];
  
  // 1. Check AVOID list (Backgrounds)
  // This helps ensure empty tubes aren't falsely marked as containing color
  for (let avoid of AVOID_COLORS) {
    if (colorDist(pixel, avoid) < 20) return -1;
  }

  // 2. Find closest LIQUID color
  let bestDist = 40; 
  let bestId = -1;

  for (let color of LIQUID_COLORS) {
    const dist = colorDist(pixel, color.rgb);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = color.id;
    }
  }

  return bestId;
};

/* ------------------------------------------------------
   MAIN SCANNER
   ------------------------------------------------------ */

// We define a Tube object to hold its coordinates and detected colors 
// before sorting them for the solver.
class TubeLocation {
    constructor(x, y, colors) {
        this.x = x;
        this.y = y;
        this.colors = colors;
    }
}


export const scanImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;

      const detectedTubes = [];

      // Iterate through Rows (Visually Top to Bottom) to find all tubes
      for (let r = 0; r < ROWS_Y.length; r++) {
        const rowY = ROWS_Y[r];
        
        // Iterate through Columns (Left to Right)
        for (let c = 0; c < COLS_X.length; c++) {
          const colX = COLS_X[c];
          
          const tubeColors = [];
          let isEmptyTube = true;

          // Scan the 4 slots in this tube (Top to Bottom)
          for (let s = 0; s < SLOT_OFFSETS.length; s++) {
            const scanX = colX;
            const scanY = rowY + SLOT_OFFSETS[s];

            // Get Pixel Data
            const idx = (scanY * w + scanX) * 4;
            const rVal = data[idx];
            const gVal = data[idx + 1];
            const bVal = data[idx + 2];

            const colorId = classifyPixel(rVal, gVal, bVal);

            if (colorId !== -1) {
              tubeColors.push(colorId);
              isEmptyTube = false;
            }
          }

          // Store the tube's location (Top-Left point of the tube area) and colors
          // The order of colors in tubeColors is already Top-to-Bottom, as required by the solver logic.
          detectedTubes.push(new TubeLocation(colX, rowY, tubeColors));
        }
      }

      // --- CRITICAL STEP: SORTING FOR THE SOLVER ---
      // The solver needs the tubes indexed R1C1, R1C2, R2C1, R2C2, etc.
      // Your requirement: Row 1 (Bottom) -> Row 3 (Top), Left to Right.
      // Since higher Y means lower on the screen, we sort by Y descending, then X ascending.

      detectedTubes.sort((a, b) => {
        // 1. Sort by Y-coordinate in DESCENDING order (Bottom row first, Top row last)
        if (a.y !== b.y) {
          return b.y - a.y; 
        }
        // 2. If on the same row, sort by X-coordinate in ASCENDING order (Left to Right)
        return a.x - b.x;
      });
      
      // Extract just the color arrays for the final solver input
      const finalTubesState = detectedTubes.map(t => t.colors);

      resolve({
        tubes: finalTubesState, // Passed to solveLevel
        colorMap: LIQUID_COLORS.map(c => c.hex) // Passed to App.jsx for display
      });
    };

    img.onerror = reject;
  });
};