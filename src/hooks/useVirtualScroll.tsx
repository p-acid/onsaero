import { useState, useEffect, useRef, useMemo } from 'react'

interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number
    item: T
    offsetTop: number
  }>
  totalHeight: number
  containerRef: React.RefObject<HTMLDivElement>
  scrollToIndex: (index: number) => void
}

/**
 * Hook for virtual scrolling to optimize performance with large lists
 * Only renders visible items + overscan buffer
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, containerHeight, overscan = 5 } = options

  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate visible range
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const itemCount = items.length
    const totalHeight = itemCount * itemHeight

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return { startIndex, endIndex, totalHeight }
  }, [items.length, itemHeight, scrollTop, containerHeight, overscan])

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const result = []
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        result.push({
          index: i,
          item: items[i],
          offsetTop: i * itemHeight,
        })
      }
    }
    return result
  }, [items, startIndex, endIndex, itemHeight])

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Scroll to index
  const scrollToIndex = (index: number) => {
    const container = containerRef.current
    if (!container) return

    const offsetTop = index * itemHeight
    container.scrollTo({ top: offsetTop, behavior: 'smooth' })
  }

  return {
    virtualItems,
    totalHeight,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    scrollToIndex,
  }
}

import type React from 'react'

/**
 * Virtual scrolling container component
 */
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string | number
  overscan?: number
  className?: string
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  className,
}: VirtualListProps<T>) {
  const { virtualItems, totalHeight, containerRef } = useVirtualScroll(items, {
    itemHeight,
    containerHeight,
    overscan,
  })

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {virtualItems.map(({ index, item, offsetTop }) => (
          <div
            key={keyExtractor(item, index)}
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example usage:
 *
 * <VirtualList
 *   items={tasks}
 *   itemHeight={60}
 *   containerHeight={500}
 *   renderItem={(task, index) => <TaskItem task={task} />}
 *   keyExtractor={(task) => task.id}
 * />
 */
