import { PriorityQueue } from "./priorityQueue";

// Heuristic: Lower is better
const calculateHeuristic = (state) => {
  let score = 0;
  for (const tube of state) {
    if (tube.length === 0) continue;
    const isUniform = tube.every(c => c === tube[0]);
    
    if (tube.length === 4 && isUniform) score -= 10;
    else if (tube.length === 3 && isUniform) score -= 5;
    else if (tube.length >= 2 && tube[0] === tube[1]) score -= 2;
  }
  return score;
};

const isGoal = (state) => {
  return state.every(tube => {
    if (tube.length === 0) return true;
    if (tube.length !== 4) return false;
    return tube.every(c => c === tube[0]);
  });
};

const getSignature = (state) => JSON.stringify(state);

export const solveLevel = (initialState) => {
  // Min-Heap based on heuristic cost
  const queue = new PriorityQueue((a, b) => a.cost < b.cost);
  
  // Node structure: { cost, state, parent, move: {from, to} }
  queue.push({ cost: 0, state: initialState, parent: null, move: null });
  
  const visited = new Set();
  visited.add(getSignature(initialState));

  let iterations = 0;
  const MAX_ITERATIONS = 10000; // Safety break

  while (!queue.isEmpty()) {
    iterations++;
    if (iterations > MAX_ITERATIONS) return { success: false, error: "Timeout" };

    const current = queue.pop();
    
    if (isGoal(current.state)) {
      // Reconstruct path
      const path = [];
      let curr = current;
      while (curr.move) {
        path.push(curr.move);
        curr = curr.parent;
      }
      return { success: true, steps: path.reverse() };
    }

    const { state } = current;

    // Generate moves
    for (let i = 0; i < state.length; i++) {
      for (let j = 0; j < state.length; j++) {
        if (i === j) continue;

        const src = state[i];
        const dest = state[j];

        // Rules: Src not empty, Dest not full, Colors match (or dest empty)
        if (src.length > 0 && dest.length < 4) {
          if (dest.length === 0 || src[0] === dest[0]) {
            // Create new state
            const newState = state.map(t => [...t]);
            const color = newState[i].shift(); // Take from top (0 index)
            newState[j].unshift(color);      // Put on top (0 index)

            const sig = getSignature(newState);
            if (!visited.has(sig)) {
              visited.add(sig);
              queue.push({
                cost: calculateHeuristic(newState),
                state: newState,
                parent: current,
                move: { from: i, to: j }
              });
            }
          }
        }
      }
    }
  }

  return { success: false, error: "No solution found" };
};