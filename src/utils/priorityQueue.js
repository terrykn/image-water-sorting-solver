export class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    self._heap = [];
    self._comparator = comparator;
  }
  size() { return self._heap.length; }
  isEmpty() { return self.size() === 0; }
  peek() { return self._heap[0]; }
  
  push(...values) {
    values.forEach(value => {
      self._heap.push(value);
      self._siftUp();
    });
    return self.size();
  }

  pop() {
    const poppedValue = self.peek();
    const bottom = self.size() - 1;
    if (bottom > 0) {
      self._swap(0, bottom);
    }
    self._heap.pop();
    self._siftDown();
    return poppedValue;
  }

  _parent(idx) { return ((idx + 1) >>> 1) - 1; }
  _left(idx) { return (idx << 1) + 1; }
  _right(idx) { return (idx + 1) << 1; }

  _greater(i, j) {
    return self._comparator(self._heap[i], self._heap[j]);
  }

  _swap(i, j) {
    [self._heap[i], self._heap[j]] = [self._heap[j], self._heap[i]];
  }

  _siftUp() {
    let node = self.size() - 1;
    while (node > 0 && self._greater(node, self._parent(node))) {
      self._swap(node, self._parent(node));
      node = self._parent(node);
    }
  }

  _siftDown() {
    let node = 0;
    while (
      (self._left(node) < self.size() && self._greater(self._left(node), node)) ||
      (self._right(node) < self.size() && self._greater(self._right(node), node))
    ) {
      let maxChild = (self._right(node) < self.size() && self._greater(self._right(node), self._left(node))) 
        ? self._right(node) 
        : self._left(node);
      self._swap(node, maxChild);
      node = maxChild;
    }
  }
}