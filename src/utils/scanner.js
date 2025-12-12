/* ------------------------------------------------------
   CONFIGURATION: HARDCODED POSITIONS
   ------------------------------------------------------ */
const COLS_X = [170, 444, 726, 1003];

// Index 0: Row 3 (Visual Top) - 635
// Index 1: Row 2 (Visual Mid) - 1125
// Index 2: Row 1 (Visual Bottom) - 1635
const ROWS_Y = [635, 1125, 1635]; 

const SLOT_OFFSETS = [0, 83, 166, 250];

const LIQUID_COLORS = [
  { id: 0, hex: "#ffdd52", rgb: [255, 221, 82] },
  { id: 1, hex: "#69d7ff", rgb: [105, 215, 255] },
  { id: 2, hex: "#f34cff", rgb: [243, 76, 255] },
  { id: 3, hex: "#ffa540", rgb: [255, 165, 64] },
  { id: 4, hex: "#5d5bff", rgb: [93, 91, 255] },
  { id: 5, hex: "#77ff64", rgb: [119, 255, 100] },
  { id: 6, hex: "#fe4f4d", rgb: [254, 79, 77] }
];

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
  for (let avoid of AVOID_COLORS) {
    if (colorDist(pixel, avoid) < 20) return -1;
  }
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

      for (let r = 0; r < ROWS_Y.length; r++) {
        const rowY = ROWS_Y[r];
        for (let c = 0; c < COLS_X.length; c++) {
          const colX = COLS_X[c];
          const tubeColors = [];

          for (let s = 0; s < SLOT_OFFSETS.length; s++) {
            const scanX = colX;
            const scanY = rowY + SLOT_OFFSETS[s];
            const idx = (scanY * w + scanX) * 4;
            const rVal = data[idx];
            const gVal = data[idx + 1];
            const bVal = data[idx + 2];

            const colorId = classifyPixel(rVal, gVal, bVal);
            if (colorId !== -1) {
              tubeColors.push(colorId);
            }
          }
          detectedTubes.push(new TubeLocation(colX, rowY, tubeColors));
        }
      }

      // --- UPDATED SORTING ---
      // Requirement: Index 0 starts at Top-Left, then right, then down.
      detectedTubes.sort((a, b) => {
        // 1. Sort by Y ASCENDING (Top rows first)
        if (Math.abs(a.y - b.y) > 10) { // Using a threshold for slight y-variations
          return a.y - b.y; 
        }
        // 2. Sort by X ASCENDING (Left to Right)
        return a.x - b.x;
      });
      
      const finalTubesState = detectedTubes.map(t => t.colors);

      resolve({
        tubes: finalTubesState,
        colorMap: LIQUID_COLORS.map(c => c.hex)
      });
    };
    img.onerror = reject;
  });
};