// Constants for detection
const THRESHOLD = 180; // Brightness threshold
const MIN_AREA = 500;  // Min pixel area to be a tube

// Helper: Convert RGB to Hex for easier logic handling
const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Euclidean distance for color similarity
const colorDist = (c1, c2) => {
  const r = c1[0] - c2[0];
  const g = c1[1] - c2[1];
  const b = c1[2] - c2[2];
  return Math.sqrt(r * r + g * g + b * b);
};

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
      const width = canvas.width;
      const height = canvas.height;

      // 1. Simple Thresholding & Flood Fill to find Contours
      // We create a visited array to mark pixels belonging to tubes
      const visited = new Int8Array(width * height);
      const contours = [];

      for (let y = 0; y < height; y += 5) { // Skip steps for speed
        for (let x = 0; x < width; x += 5) {
          const idx = (y * width + x) * 4;
          const brightness = (data[idx] + data[idx+1] + data[idx+2]) / 3;

          // If bright pixel (tube border/liquid) and not visited
          if (brightness > THRESHOLD && !visited[y * width + x]) {
            // Perform Flood Fill to get bounding box
            const stack = [[x, y]];
            let minX = x, maxX = x, minY = y, maxY = y;
            let count = 0;

            while(stack.length > 0) {
              const [cx, cy] = stack.pop();
              const cIdx = cy * width + cx;
              
              if (cx < 0 || cx >= width || cy < 0 || cy >= height || visited[cIdx]) continue;
              
              // check threshold
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

            // If blob is big enough, it's a tube
            if (count > MIN_AREA) {
              contours.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
            }
          }
        }
      }

      // 2. Sort Contours (Top-Left to Bottom-Right)
      // Similar to Python's _compare_centers
      contours.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 50) return a.y - b.y;
        return a.x - b.x;
      });

      // 3. Extract Colors
      const tubes = [];
      contours.forEach(cnt => {
        // Sample down the center of the bounding box
        const centerX = Math.floor(cnt.x + cnt.w / 2);
        const startY = cnt.y;
        const endY = cnt.y + cnt.h;
        const segmentHeight = Math.floor(cnt.h / 4); // Assume 4 slots

        const tubeColors = [];
        
        // We take 4 samples
        for(let i = 0; i < 4; i++) {
          // Adjust sampleY to avoid the very top/bottom of segments
          const sampleY = Math.floor(startY + (segmentHeight * i) + (segmentHeight * 0.5));
          if (sampleY >= height) continue;

          const idx = (sampleY * width + centerX) * 4;
          const r = data[idx];
          const g = data[idx+1];
          const b = data[idx+2];

          // Check if "suspicious" (black/dark background inside tube -> empty slot)
          if (r < 45 && g < 45 && b < 45) {
             // Empty, don't add
          } else {
             tubeColors.push([r, g, b]);
          }
        }
        // In the game, data is stored Top->Bottom.
        // If the tube isn't full, the empty space is usually at the top.
        // However, standard representation usually just lists colors present.
        tubes.push(tubeColors);
      });

      // 4. Cluster Colors (Map RGB -> 0,1,2,3...)
      const colorMap = []; // Array of [r,g,b]
      const simplifiedTubes = tubes.map(tube => {
        return tube.map(color => {
          // Find existing close color
          let matchIndex = colorMap.findIndex(ref => colorDist(ref, color) < 30);
          if (matchIndex === -1) {
            colorMap.push(color);
            matchIndex = colorMap.length - 1;
          }
          return matchIndex;
        });
      });
      
      // Add 2 empty tubes (standard game rules usually allow 2 spares)
      simplifiedTubes.push([], []);

      resolve({ 
        tubes: simplifiedTubes, 
        colorMap: colorMap.map(c => `rgb(${c[0]},${c[1]},${c[2]})`) 
      });
    };
    img.onerror = reject;
  });
};