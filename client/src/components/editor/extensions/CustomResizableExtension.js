import { Extension } from "@tiptap/core";
import throttle from "lodash-es/throttle";

const CustomResizableExtension = Extension.create({
  name: "resizable",
  priority: 1000,
  addOptions() {
    return {
      types: ["image"],
      handlerStyle: {
        width: "10px",
        height: "10px",
        background: "#1677ff",
        border: "2px solid #ffffff",
        borderRadius: "50%",
        pointerEvents: "all",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        zIndex: "1000",
      },
      layerStyle: {
        border: "2px solid #1677ff",
        pointerEvents: "none",
        zIndex: "999",
      },
    };
  },

  addStorage() {
    return {
      resizeElement: null,
      resizeNode: null,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          width: {
            default: null,
            parseHTML: (element) => {
              // Priority: width attribute > style width
              return element.getAttribute('width') || 
                     (element.style.width ? element.style.width.replace('px', '') + 'px' : null);
            },
            renderHTML: (attributes) => {
              if (!attributes.width) return {};
              const width = attributes.width.toString().includes('px') ? attributes.width : attributes.width + 'px';
              // Only set width in style if there's no height attribute to avoid conflicts
              const heightAttr = attributes.height;
              if (heightAttr) {
                return { width: width };
              } else {
                return { width: width, style: `width: ${width}; height: auto;` };
              }
            },
          },
          height: {
            default: null,
            parseHTML: (element) => {
              // Priority: height attribute > style height
              return element.getAttribute('height') || 
                     (element.style.height ? element.style.height.replace('px', '') + 'px' : null);
            },
            renderHTML: (attributes) => {
              if (!attributes.height) return {};
              const height = attributes.height.toString().includes('px') ? attributes.height : attributes.height + 'px';
              const width = attributes.width;
              if (width) {
                // Both width and height are present - use explicit dimensions
                const widthValue = width.toString().includes('px') ? width : width + 'px';
                return { 
                  height: height,
                  style: `width: ${widthValue}; height: ${height};`
                };
              } else {
                // Only height is present
                return { 
                  height: height,
                  style: `height: ${height}; width: auto;`
                };
              }
            },
          },
        },
      },
    ];
  },

  onCreate({ editor }) {
    const element = editor.options.element;
    element.style.position = "relative";

    // 初始化 resizeLayer
    const resizeLayer = document.createElement("div");
    resizeLayer.className = "resize-layer";
    resizeLayer.style.display = "none";
    resizeLayer.style.position = "absolute";
    // 设置样式
    Object.entries(this.options.layerStyle).forEach(([key, value]) => {
      resizeLayer.style[key] = value;
    });
    // 事件处理
    resizeLayer.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const resizeElement = this.storage.resizeElement;
      const resizeNode = this.storage.resizeNode;
      if (!resizeElement) return;
      //if (/bottom/.test(e.target.className)) {
      if (e.target.classList.contains("handler")) {
        let startX = e.screenX;
        const isLeftHandle = e.target.classList.contains("bottom-left") || e.target.classList.contains("top-left");
        const dir = isLeftHandle ? -1 : 1;
        const mousemoveHandle = (e) => {
          const width = resizeElement.clientWidth;
          const distanceX = e.screenX - startX;
          const total = width + dir * distanceX;
          
          // Maintain aspect ratio - with safety checks
          let aspectRatio = 1; // Default aspect ratio
          if (resizeElement.naturalWidth && resizeElement.naturalHeight) {
            aspectRatio = resizeElement.naturalHeight / resizeElement.naturalWidth;
          } else if (resizeElement.clientWidth && resizeElement.clientHeight) {
            // Fallback to current display dimensions if natural dimensions aren't available
            aspectRatio = resizeElement.clientHeight / resizeElement.clientWidth;
          }
          
          const newHeight = total * aspectRatio;
          
          // Ensure minimum size
          const minSize = 20;
          const finalWidth = Math.max(minSize, total);
          const finalHeight = Math.max(minSize, newHeight);
          
          // Update element styles for immediate visual feedback
          resizeElement.style.width = finalWidth + "px";
          resizeElement.style.height = finalHeight + "px";
          
          // Update resizeLayer position and size
          const pos = getRelativePosition(resizeElement, element);
          resizeLayer.style.top = pos.top + "px";
          resizeLayer.style.left = pos.left + "px";
          resizeLayer.style.width = finalWidth + "px";
          resizeLayer.style.height = finalHeight + "px";
          startX = e.screenX;
        };
        
        const mouseupHandle = () => {
          // On mouse up, dispatch a proper TipTap transaction to persist the changes
          const finalWidth = parseInt(resizeElement.style.width);
          const finalHeight = parseInt(resizeElement.style.height);
          
          // Find the position of the selected node
          const selection = editor.state.selection;
          if (selection && selection.node) {
            const transaction = editor.state.tr.setNodeMarkup(
              selection.from,
              null,
              {
                ...selection.node.attrs,
                width: `${finalWidth}px`,
                height: `${finalHeight}px`,
              }
            );
            editor.view.dispatch(transaction);
          }
          
          document.removeEventListener("mousemove", mousemoveHandle);
          document.removeEventListener("mouseup", mouseupHandle);
        };
        
        document.addEventListener("mousemove", mousemoveHandle);
        document.addEventListener("mouseup", mouseupHandle);
      }
    });
    // 句柄
    const handlers = ["top-left", "top-right", "bottom-left", "bottom-right"];
    const fragment = document.createDocumentFragment();
    for (let name of handlers) {
      const item = document.createElement("div");
      item.className = `handler ${name}`;
      item.style.position = "absolute";
      Object.entries(this.options.handlerStyle).forEach(([key, value]) => {
        item.style[key] = value;
      });
      const dir = name.split("-");
      item.style[dir[0]] = parseInt(item.style.width) / -2 + "px";
      item.style[dir[1]] = parseInt(item.style.height) / -2 + "px";
      if (name === "bottom-left") item.style.cursor = "sw-resize";
      if (name === "bottom-right") item.style.cursor = "se-resize";
      if (name === "top-left") item.style.cursor = "nw-resize";
      if (name === "top-right") item.style.cursor = "ne-resize";
      fragment.appendChild(item);
    }
    resizeLayer.appendChild(fragment);
    editor.resizeLayer = resizeLayer;
    element.appendChild(resizeLayer);
  },

  onTransaction: throttle(function ({ editor }) {
    const resizeLayer = editor.resizeLayer;
    if (resizeLayer && resizeLayer.style.display === "block") {
      const dom = this.storage.resizeElement;
      const element = editor.options.element;
      const pos = getRelativePosition(dom, element);
      resizeLayer.style.top = pos.top + "px";
      resizeLayer.style.left = pos.left + "px";
      resizeLayer.style.width = dom.clientWidth + "px";
      resizeLayer.style.height = dom.clientHeight + "px";
    }
  }, 240),

  onSelectionUpdate: function ({ editor, transaction }) {
    const element = editor.options.element;
    const node = transaction.curSelection.node;
    const resizeLayer = editor.resizeLayer;
    //选中 resizable node 时
    if (node && this.options.types.includes(node.type.name)) {
      // resizeLayer位置大小
      resizeLayer.style.display = "block";
      let dom = editor.view.domAtPos(transaction.curSelection.from).node;
      dom = dom.querySelector(".ProseMirror-selectednode");
      this.storage.resizeElement = dom;
      this.storage.resizeNode = node;
      const pos = getRelativePosition(dom, element);
      resizeLayer.style.top = pos.top + "px";
      resizeLayer.style.left = pos.left + "px";
      resizeLayer.style.width = dom.clientWidth + "px";
      resizeLayer.style.height = dom.clientHeight + "px";
    } else {
      resizeLayer.style.display = "none";
    }
  },
});

// 计算相对位置
function getRelativePosition(element, ancestor) {
  const elementRect = element.getBoundingClientRect();
  const ancestorRect = ancestor.getBoundingClientRect();
  const relativePosition = {
    top: parseInt(elementRect.top - ancestorRect.top + ancestor.scrollTop),
    left: parseInt(elementRect.left - ancestorRect.left + ancestor.scrollLeft),
  };
  return relativePosition;
}

export default CustomResizableExtension;
