import { Extension } from '@tiptap/core'

export const CustomResizable = Extension.create({
  name: 'customResizable',

  addOptions() {
    return {
      types: ['image'],
      handlerStyle: {
        width: '12px',
        height: '12px',
        border: '1px solid #1677ff',
        background: '#fff',
        borderRadius: '50%',
        zIndex: 3,
      },
      layerStyle: {
        border: '2px solid #1677ff',
        zIndex: 2,
      },
    }
  },

  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: element => element.style.width,
        renderHTML: attributes => {
          if (!attributes.width) return {}
          return { style: `width: ${attributes.width}` }
        },
      },
      height: {
        default: null,
        parseHTML: element => element.style.height,
        renderHTML: attributes => {
          if (!attributes.height) return {}
          return { style: `height: ${attributes.height}` }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    const { handlerStyle, layerStyle } = this.options

    return [
      {
        key: new Object('custom-resizable'),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              const target = event.target
              if (!target.hasAttribute('data-drag-handle')) return false

              event.preventDefault()
              event.stopPropagation()

              const { state } = view
              const { selection } = state
              const selectedNode = selection.node

              if (!selectedNode || !this.options.types.includes(selectedNode.type.name)) return false

              const element = target.closest('[data-node-view-wrapper]')
              if (!element) return false

              const startWidth = element.offsetWidth
              const startHeight = element.offsetHeight
              const startX = event.pageX
              const startY = event.pageY
              const handle = target.getAttribute('data-drag-handle')

              const onMouseMove = (e) => {
                e.preventDefault()
                const deltaX = e.pageX - startX
                const deltaY = e.pageY - startY
                let newWidth = startWidth
                let newHeight = startHeight

                if (handle.includes('right')) {
                  newWidth = startWidth + deltaX
                } else if (handle.includes('left')) {
                  newWidth = startWidth - deltaX
                }

                if (handle.includes('bottom')) {
                  newHeight = startHeight + deltaY
                } else if (handle.includes('top')) {
                  newHeight = startHeight - deltaY
                }

                const minSize = 20
                newWidth = Math.max(minSize, newWidth)
                newHeight = Math.max(minSize, newHeight)

                element.style.width = `${newWidth}px`
                element.style.height = `${newHeight}px`

                const transaction = view.state.tr.setNodeMarkup(
                  selection.from,
                  null,
                  {
                    ...selectedNode.attrs,
                    width: `${newWidth}px`,
                    height: `${newHeight}px`,
                  }
                )
                view.dispatch(transaction)
              }

              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove)
                document.removeEventListener('mouseup', onMouseUp)
              }

              document.addEventListener('mousemove', onMouseMove)
              document.addEventListener('mouseup', onMouseUp)

              return true
            },
          },
          decorations: state => {
            const { doc, selection } = state
            if (!selection.node || !this.options.types.includes(selection.node.type.name)) {
              return null
            }

            const decorations = []

            doc.nodesBetween(selection.from, selection.to, (node, pos) => {
              if (!this.options.types.includes(node.type.name)) return

              const handlers = [
                { pos: 'top-left', cursor: 'nw-resize' },
                { pos: 'top-right', cursor: 'ne-resize' },
                { pos: 'bottom-left', cursor: 'sw-resize' },
                { pos: 'bottom-right', cursor: 'se-resize' },
              ]

              handlers.forEach(({ pos: position, cursor }) => {
                const handler = document.createElement('div')
                handler.setAttribute('data-drag-handle', position)
                Object.assign(handler.style, {
                  ...handlerStyle,
                  cursor,
                  position: 'absolute',
                  [position.split('-')[0]]: '-6px',
                  [position.split('-')[1]]: '-6px',
                })

                decorations.push({
                  from: pos,
                  to: pos + node.nodeSize,
                  node: handler,
                })
              })

              const resizeLayer = document.createElement('div')
              Object.assign(resizeLayer.style, {
                ...layerStyle,
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              })

              decorations.push({
                from: pos,
                to: pos + node.nodeSize,
                node: resizeLayer,
              })
            })

            return decorations.length ? decorations : null
          },
        },
      },
    ]
  },
})

export default CustomResizable 