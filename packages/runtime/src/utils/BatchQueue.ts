/**
 * A helper class to batch multiple callbacks and process them in a single update step just before the next frame render, but after the current stack.
 * This is more efficient than processing each callback in a separate requestAnimationFrame due to the overhead.
 */
export class BatchQueue {
  constructor(type?: 'sync' | 'async') {
    this.type = type ?? 'async'
  }
  private type: 'sync' | 'async'
  private batchQueue: Array<() => void> = []
  private isProcessing = false
  private processBatch() {
    if (this.isProcessing) return
    this.isProcessing = true

    if (this.type === 'sync') {
      queueMicrotask(() => {
        while (this.batchQueue.length > 0) {
          const callback = this.batchQueue.shift()
          callback?.()
        }
        this.isProcessing = false
      })
    } else {
      requestAnimationFrame(() => {
        while (this.batchQueue.length > 0) {
          const callback = this.batchQueue.shift()
          callback?.()
        }
        this.isProcessing = false
      })
    }
  }
  public add(callback: () => void) {
    this.batchQueue.push(callback)
    this.processBatch()
  }
}
