/**
 * Circular Bucket Queue.
 *
 * Returns input'd points in sorted order. All operations run in roughly O(1)
 * time (for input with small cost values), but it has a strict requirement:
 *
 * If the most recent point had a cost of c, any points added should have a cost
 * c' in the range c <= c' <= c + (capacity - 1).
 */
export class BucketQueue {
  /**
   * @param bits - Number of bits.
   * @param getPriority - A function that returns the priority of an item
   */
  constructor({ numBits, getPriority, areEqual }) {
    this._bucketCount = 1 << numBits // # of buckets = 2^numBits
    this._mask = this._bucketCount - 1 // 2^numBits - 1 = index mask
    this._size = 0
    this._currentBucketIndex = 0
    this._buckets = this._buildArray(this._bucketCount)

    this._getPriority =
      typeof getPriority !== "undefined" ? getPriority : item => item

    this._areEqual =
      typeof areEqual === "function"
        ? areEqual
        : (itemA, itemB) => itemA === itemB
  }

  /**
   * Prepend item to the list in the appropriate bucket
   * @param item - Item to be added to the queue based on its priority
   */
  push(item) {
    const bucketIndex = this._getBucketIndex(item)
    const oldHead = this._buckets[bucketIndex]
    const newHead = {
      value: item,
      next: oldHead
    }

    this._buckets[bucketIndex] = newHead
    this._size++
  }

  pop() {
    if (this._size === 0) {
      throw new Error("Cannot pop because the queue is empty.")
    }

    // Find first empty bucket
    while (this._buckets[this._currentBucketIndex] === null) {
      this._currentBucketIndex =
        (this._currentBucketIndex + 1) % this._bucketCount
    }

    // All items in bucket have same cost, return the first one
    const ret = this._buckets[this._currentBucketIndex]

    this._buckets[this._currentBucketIndex] = ret.next
    this._size--

    return ret.value
  }

  /**
   * Tries to remove item from queue.
   * @param item - Item to be removed from the queue
   * @returns True if the item is found and removed or false otherwise
   */
  remove(item) {
    if (!item) {
      return false
    }

    // To find node, go to bucket and search through unsorted list.
    const bucketIndex = this._getBucketIndex(item)
    const firstBucketNode = this._buckets[bucketIndex]
    let node = firstBucketNode
    let prevNode

    while (node !== null) {
      if (this._areEqual(item, node.value)) {
        break
      }

      prevNode = node
      node = node.next
    }

    // Item not found
    if (node === null) {
      return false
    }

    // Item found and it needs to be removed from the list
    if (node === firstBucketNode) {
      this._buckets[bucketIndex] = node.next
    } else {
      prevNode.next = node.next
    }

    this._size--
    return true
  }

  isEmpty() {
    return this._size === 0
  }

  /**
   * Return the bucket index
   * @param item - Item for which the bucket shall be returned
   * @returns Bucket index for the item provided
   */
  _getBucketIndex(item) {
    return this._getPriority(item) & this._mask
  }

  /**
   * Create array and initialze pointers to null
   * @param size - Size of the new array
   * @returns An array with `N` buckets pointing to null
   */
  _buildArray(size) {
    const buckets = new Array(size)
    buckets.fill(null)
    return buckets
  }
}
