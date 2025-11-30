// ==========================================
// CONFIGURATION & CONSTANTS
// ==========================================

const THRESHOLD = 180; // Brightness threshold for tube borders
const MIN_AREA = 500;  // Min pixel area to be considered a tube

// STRICT MATCHING CONFIGURATION
const MAX_COLOR_DIST = 200; // Tolerance: Lower = Stricter (20 is very strict)

// The specific colors allowed
const RAW_PALETTE = [
  "#fdf35b", // Yellow
  "#6ad9fa", // Light Blue
  "#f54cff", // Magenta
  "#ffa442", // Orange
  "#5c5cf7", // Blue/Indigo
  "#78ff65", // Green
  "#fe4e51"  // Red
];

// Helper: Hex to RGB Array
const hexToRgb = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

// Pre-calculate target RGBs for performance
const TARGET_COLORS = RAW_PALETTE.map((hex, index) => ({
  id: index,
  hex: hex,
  rgb: hexToRgb(hex)
}));

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Euclidean distance for color similarity
const colorDist = (c1, c2) => {
  const r = c1[0] - c2[0];
  const g = c1[1] - c2[1];
  const b = c1[2] - c2[2];
  return Math.sqrt(r * r + g * g + b * b);
};

// Find the closest color from our specific palette
const findClosestColor = (r, g, b) => {
  let closestIndex = -1;
  let minDistance = 99999;

  for (let i = 0; i < TARGET_COLORS.length; i++) {
    const target = TARGET_COLORS[i];
    const dist = colorDist([r, g, b], target.rgb);

    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  // Only return the match if it is "very very extremely close"
  if (minDistance <= MAX_COLOR_DIST) {
    return closestIndex;
  }
  
  return -1; // No valid color found (noise or empty)
};

// ==========================================
// MAIN SCANNING LOGIC
// ==========================================

export const scanImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Handle high-res displays/scaling issues if necessary, 
      // but standard width/height usually works for raw image analysis
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Find Contours (Tube detection)
      const visited = new Int8Array(width * height);
      const contours = [];

      for (let y = 0; y < height; y += 5) {
        for (let x = 0; x < width; x += 5) {
          const idx = (y * width + x) * 4;
          const brightness = (data[idx] + data[idx+1] + data[idx+2]) / 3;

          if (brightness > THRESHOLD && !visited[y * width + x]) {
            const stack = [[x, y]];
            let minX = x, maxX = x, minY = y, maxY = y;
            let count = 0;

            while(stack.length > 0) {
              const [cx, cy] = stack.pop();
              const cIdx = cy * width + cx;
              
              if (cx < 0 || cx >= width || cy < 0 || cy >= height || visited[cIdx]) continue;
              
              const pIdx = (cy * width + cx) * 4;
              const b = (data[pIdx] + data[pIdx+1] + data[pIdx+2]) / 3;
              
              if (b > THRESHOLD) {
                visited[cIdx] = 1;
                count++;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
              }
            }

            if (count > MIN_AREA) {
              contours.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
            }
          }
        }
      }

      // 2. Sort Contours (Top-Left to Bottom-Right)
      contours.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 50) return a.y - b.y;
        return a.x - b.x;
      });

      // 3. Extract and Map Colors Immediately
      const tubes = [];
      
      contours.forEach(cnt => {
        const centerX = Math.floor(cnt.x + cnt.w / 2);
        const startY = cnt.y;
        const segmentHeight = Math.floor(cnt.h / 4); 

        const tubeColors = [];
        
        // Scan 4 slots per tube
        for(let i = 0; i < 4; i++) {
          const sampleY = Math.floor(startY + (segmentHeight * i) + (segmentHeight * 0.5));
          if (sampleY >= height) continue;

          const idx = (sampleY * width + centerX) * 4;
          const r = data[idx];
          const g = data[idx+1];
          const b = data[idx+2];

          // Check if it's the black background (empty space)
          if (r < 45 && g < 45 && b < 45) {
             // It's empty/black, ignore
          } else {
             // Check against our STRICT Palette
             const colorId = findClosestColor(r, g, b);
             if (colorId !== -1) {
                 tubeColors.push(colorId);
             }
          }
        }
        tubes.push(tubeColors);
      });

      // Add 2 empty tubes (Standard game rules)
      tubes.push([], []);

      resolve({ 
        tubes: tubes, 
        // Return the palette formatted as CSS strings so the UI can render them
        colorMap: RAW_PALETTE 
      });
    };
    
    img.onerror = reject;
  });
};
