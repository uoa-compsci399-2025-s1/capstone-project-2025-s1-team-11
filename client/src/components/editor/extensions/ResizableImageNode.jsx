import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React, { useRef, useEffect, useState } from 'react'

const ResizableImageComponent = ({ node, updateAttributes }) => {
  const imageRef = useRef(null)
  const [isResizing, setIsResizing] = useState(false)
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })
  const [startSize, setStartSize] = useState({ width: 0, height: 0 })

  const handleMouseDown = (e, position) => {
    if (!imageRef.current) return

    e.preventDefault()
    setIsResizing(true)
    setStartPosition({ x: e.clientX, y: e.clientY })
    setStartSize({
      width: imageRef.current.offsetWidth,
      height: imageRef.current.offsetHeight,
    })

    const handleMouseMove = (e) => {
      if (!isResizing) return

      const deltaX = e.clientX - startPosition.x
      const deltaY = e.clientY - startPosition.y

      let newWidth = startSize.width
      let newHeight = startSize.height

      switch (position) {
        case 'top-left':
          newWidth = startSize.width - deltaX
          newHeight = startSize.height - deltaY
          break
        case 'top-right':
          newWidth = startSize.width + deltaX
          newHeight = startSize.height - deltaY
          break
        case 'bottom-left':
          newWidth = startSize.width - deltaX
          newHeight = startSize.height + deltaY
          break
        case 'bottom-right':
          newWidth = startSize.width + deltaX
          newHeight = startSize.height + deltaY
          break
      }

      // Enforce minimum size
      const minSize = 20
      newWidth = Math.max(minSize, newWidth)
      newHeight = Math.max(minSize, newHeight)

      updateAttributes({
        width: newWidth,
        height: newHeight,
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const corners = [
    { position: 'top-left', style: { top: -5, left: -5, cursor: 'nw-resize' } },
    { position: 'top-right', style: { top: -5, right: -5, cursor: 'ne-resize' } },
    { position: 'bottom-left', style: { bottom: -5, left: -5, cursor: 'sw-resize' } },
    { position: 'bottom-right', style: { bottom: -5, right: -5, cursor: 'se-resize' } },
  ]

  return (
    <NodeViewWrapper className="resizable-image">
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          style={{
            width: node.attrs.width ? `${node.attrs.width}px` : 'auto',
            height: node.attrs.height ? `${node.attrs.height}px` : 'auto',
            display: 'inline-block',
            verticalAlign: 'bottom',
          }}
        />
        {corners.map(({ position, style }) => (
          <div
            key={position}
            className="resize-handle"
            onMouseDown={(e) => handleMouseDown(e, position)}
            style={{
              ...style,
            }}
          />
        ))}
      </div>
    </NodeViewWrapper>
  )
}

export const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
      },
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width'),
      },
      height: {
        default: null,
        parseHTML: element => element.getAttribute('height'),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})

export default ResizableImage 