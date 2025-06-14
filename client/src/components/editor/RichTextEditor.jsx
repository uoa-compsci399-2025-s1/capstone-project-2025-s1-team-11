import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import TipTapImage from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Extension } from '@tiptap/core';
import { Button, Tooltip, Select, Upload, Slider, Card, theme } from 'antd';
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, EnterOutlined,
  PictureOutlined
} from '@ant-design/icons';
import CustomResizableExtension from './extensions/CustomResizableExtension';
//import './CompactRichTextEditor.css';

const { Option } = Select;

const INDENT_STEP_EM = 2;
const MAX_INDENT_LEVEL = 3;

const CustomIndentExtension = Extension.create({
  name: 'customIndent',

  addOptions() {
    return {
      types: ['paragraph'],
      defaultIndentLevel: 0,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: this.options.defaultIndentLevel,
            parseHTML: element => {
              const M_attr = element.getAttribute('data-indent');
              if (M_attr) {
                return parseInt(M_attr, 10) || this.options.defaultIndentLevel;
              }
              const pl = element.style.paddingLeft;
              if (pl && pl.endsWith('em')) {
                const num = parseFloat(pl);
                return Math.round(num / INDENT_STEP_EM) || this.options.defaultIndentLevel;
              }
              return this.options.defaultIndentLevel;
            },
            renderHTML: attributes => {
              const indentLevel = attributes.indent || this.options.defaultIndentLevel;
              if (indentLevel === this.options.defaultIndentLevel) {
                return {};
              }
              return {
                'data-indent': indentLevel,
                style: `padding-left: ${indentLevel * INDENT_STEP_EM}em;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ editor, chain }) => {
        const node = editor.state.selection.$head.parent;
        if (!this.options.types.includes(node.type.name)) return false;

        const currentIndent = editor.getAttributes(node.type.name).indent || 0;
        if (currentIndent < MAX_INDENT_LEVEL) {
          return chain().updateAttributes(node.type.name, { indent: currentIndent + 1 }).run();
        }
        return false;
      },
      outdent: () => ({ editor, chain }) => {
        const node = editor.state.selection.$head.parent;
        if (!this.options.types.includes(node.type.name)) return false;
        
        const currentIndent = editor.getAttributes(node.type.name).indent || 0;
        if (currentIndent > 0) {
          return chain().updateAttributes(node.type.name, { indent: currentIndent - 1 }).run();
        }
        return false;
      },
    };
  },
});

const CompactRichTextEditor = ({ content, onChange  }) => { //placeholder = 'Enter content...'
  const { token } = theme.useToken();
  
  // Add custom styles for the editor
  useEffect(() => {
    const styleId = 'rich-text-editor-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .rich-text-editor-toolbar {
          background-color: ${token.colorFillSecondary};
          border-bottom: 1px solid ${token.colorBorderSecondary};
          padding: 4px;
          border-top-left-radius: 2px;
          border-top-right-radius: 2px;
        }
        .ProseMirror {
          min-height: 34px;
          padding: 8px 12px !important;
          margin: 0 !important;
          color: ${token.colorText};
          background-color: ${token.colorBgContainer};
          overflow: hidden;
          position: relative;
          font-family: 'Times New Roman', Times, serif;
        }
        .ProseMirror p {
          margin: 0;
        }
        .ProseMirror img {
          height: auto;
          position: relative;
          z-index: 1;
        }
        .ProseMirror sub {
          vertical-align: sub;
          font-size: smaller;
        }
        .ProseMirror sup {
          vertical-align: super;
          font-size: smaller;
        }
        .compact-editor-container {
          position: relative;
          overflow: hidden;
        }
        .compact-editor-container .ant-card {
          overflow: hidden !important;
          z-index: 10;
          position: relative;
        }
        .compact-editor-container .ant-card-body {
          overflow: hidden !important;
        }
        .resize-layer {
          z-index: 1000 !important;
        }
        .handler {
          z-index: 1001 !important;
        }
        /* Ensure modal dialogs appear above images */
        .ant-modal, .ant-modal-wrap, .ant-modal-mask {
          z-index: 1050 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [token]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: {
          HTMLAttributes: {
            class: 'debug-bold',
            style: 'font-weight: 700'
          },
        },
        italic: {
          HTMLAttributes: {
            style: 'font-style: italic'
          },
        },
        paragraph: {
          HTMLAttributes: {
            preserveWhitespace: true,
            preserveStyle: true
          },
          parseHTML() {
            return [
              { 
                tag: 'p',
                getAttrs: (node) => ({
                  style: node.getAttribute('style'),
                  class: node.getAttribute('class'),
                  ...node.style
                })
              }
            ]
          },
          renderHTML({ node, HTMLAttributes }) {
            return ['p', { ...HTMLAttributes, style: node.attrs.style }, 0]
          }
        },
        hardBreak: {
          HTMLAttributes: {
            preserveStyle: true
          },
          parseHTML() {
            return [
              { tag: 'br' },
              { tag: 'div', getAttrs: node => node.style.display === 'block' }
            ]
          }
        },
        image: false
      }),
      Underline.configure({
        HTMLAttributes: {
          style: 'text-decoration: underline'
        },
      }),
      TextStyle.configure({
        types: ['textStyle', 'paragraph'],
      }),
      FontFamily.configure({
        types: ['textStyle', 'paragraph'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Typography,
      CustomIndentExtension,
      TipTapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'display: inline; vertical-align: baseline;'
        },
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: element => {
                // Priority: width attribute > style width > natural width
                return element.getAttribute('width') || 
                       (element.style.width ? element.style.width.replace('px', '') + 'px' : null);
              },
              renderHTML: attributes => {
                if (!attributes.width) return {};
                const width = attributes.width.toString().includes('px') ? attributes.width : attributes.width + 'px';
                // Only set width in style if there's no height attribute to avoid conflicts
                const heightAttr = attributes.height;
                if (heightAttr) {
                  return { width: width };
                } else {
                  return { 
                    width: width,
                    style: `width: ${width}; height: auto;`
                  };
                }
              },
            },
            height: {
              default: null,
              parseHTML: element => {
                // Priority: height attribute > style height > natural height
                return element.getAttribute('height') || 
                       (element.style.height ? element.style.height.replace('px', '') + 'px' : null);
              },
              renderHTML: attributes => {
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
          };
        }
      }),
      CustomResizableExtension,
      Subscript,
      Superscript,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onCreate: () => {
      // Editor created successfully
    },
    onDestroy: () => {
      // Editor destroyed
    },
    editorProps: {
      attributes: {
        class: 'compact-editor-content',
        spellcheck: 'false',
        style: 'outline: none !important; margin: 0 !important;'
      },
      parseOptions: {
        preserveWhitespace: true
      },
      // Override default ProseMirror styles
      transformPastedHTML(html) {
        return html.replace(/style="[^"]*"/g, (match) => {
          // Preserve existing styles but remove any padding/margin
          return match.replace(/(padding|margin)[^;]*(;|")/g, '');
        });
      },
      handleDrop: (view, event, slice, moved) => {
        if (moved && event.target.nodeName === 'IMG') {
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (coordinates) {
            const transaction = view.state.tr.deleteSelection();
            const insertPos = coordinates.pos;
            return transaction.insert(insertPos, slice.content);
          }
        }
        return false;
      },
      handleDOMEvents: {
        mouseup: (view, event) => {
          // Additional handler for resize completion
          if (event.target.closest('.resize-handler')) {
            onChange(editor.getHTML());
          }
        }
      }
    },
    editable: true,
    enableContentCheck: true,
  });

  // Add style element to hide unwanted handles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [data-drag-handle="top-left"],
      [data-drag-handle="top-right"],
      [data-drag-handle="bottom-left"] {
        display: none !important;
      }
      [data-drag-handle="bottom-right"] {
        cursor: se-resize !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (editor) {
      // Create a mutation observer to watch for image size changes
      const observer = new MutationObserver((mutations) => {
        let hasImageChange = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'style' && 
              mutation.target.tagName === 'IMG') {
            hasImageChange = true;
          }
        });
        
        if (hasImageChange) {
          onChange(editor.getHTML());
        }
      });

      // Start observing the editor content
      const editorElement = editor.view.dom;
      observer.observe(editorElement, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['style']
      });

      return () => observer.disconnect();
    }
  }, [editor, onChange]);

  if (!editor) {
    return null;
  }

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      if (editor) {
        // Create a temporary image to get natural dimensions using native Image constructor
        const tempImage = new window.Image();
        tempImage.onload = () => {
          // Get the editor container width for size calculation
          const editorElement = editor.view.dom.closest('.compact-editor-container');
          const containerWidth = editorElement ? editorElement.clientWidth - 40 : 400; // Account for padding
          const maxInitialWidth = Math.min(containerWidth * 0.5, 400); // Max 64% of container or 400px (reduced by 20%)
          
          let insertWidth = tempImage.naturalWidth;
          let insertHeight = tempImage.naturalHeight;
          
          // Apply size constraint only if image is larger than max
          if (insertWidth > maxInitialWidth) {
            const aspectRatio = insertHeight / insertWidth;
            insertWidth = maxInitialWidth;
            insertHeight = insertWidth * aspectRatio;
          }
          
          // Insert image with calculated dimensions
          editor.chain()
            .focus()
            .setImage({ 
              src: dataUrl,
              width: `${insertWidth}px`,
              height: `${insertHeight}px`
            })
            .run();
        };
        tempImage.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleSoftReturn = () => {
    editor.chain().focus().insertContent('<br>').run();
  };

  const handleParagraph = () => {
    editor.chain()
      .focus()
      .splitBlock()
      .run();
  };

  const handleFontFamily = (value) => {
    if (value === 'default') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(value).run();
    }
  };

  const handleIndent = () => {
    editor.commands.indent();
  };

  const handleOutdent = () => {
    editor.commands.outdent();
  };

  return (
    <div className="compact-editor-container">
      <Card 
        size="small" 
        styles={{ 
          body: { 
            padding: 0,
          },
          header: {
            minHeight: 'auto',
            padding: 0
          },
          'ant-card': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.02)',
            transition: 'all 0.25s ease'
          }
        }}
        style={{
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.25s ease'
        }}
      >
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <div className="rich-text-editor-toolbar">
            <Tooltip title="Bold">
              <Button
                type="text"
                size="small"
                icon={<BoldOutlined />}
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Italic">
              <Button
                type="text"
                size="small"
                icon={<ItalicOutlined />}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Underline">
              <Button
                type="text"
                size="small"
                icon={<UnderlineOutlined />}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive('underline') ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Subscript">
              <Button
                type="text"
                size="small"
                icon={<span style={{ fontSize: '0.8em' }}>X₂</span>}
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                className={editor.isActive('subscript') ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Superscript">
              <Button
                type="text"
                size="small"
                icon={<span style={{ fontSize: '0.8em' }}>X²</span>}
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                className={editor.isActive('superscript') ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Align Left">
              <Button
                type="text"
                size="small"
                icon={<AlignLeftOutlined />}
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Align Center">
              <Button
                type="text"
                size="small"
                icon={<AlignCenterOutlined />}
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Align Right">
              <Button
                type="text"
                size="small"
                icon={<AlignRightOutlined />}
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
              />
            </Tooltip>

            <Tooltip title="Indent">
              <Button
                type="text"
                size="small"
                icon={<MenuUnfoldOutlined />}
                onClick={handleIndent}
              />
            </Tooltip>

            <Tooltip title="Outdent">
              <Button
                type="text"
                size="small"
                icon={<MenuFoldOutlined />}
                onClick={handleOutdent}
              />
            </Tooltip>

            <Tooltip title="Paragraph">
              <Button
                type="text"
                size="small"
                icon={<span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>¶</span>}
                onClick={handleParagraph}
              />
            </Tooltip>

            <Tooltip title="Soft Return (Line Break)">
              <Button
                type="text"
                size="small"
                icon={<EnterOutlined style={{ transform: 'rotateY(180deg)' }} />}
                onClick={handleSoftReturn}
              />
            </Tooltip>

            <Tooltip title="Font Family">
              <Select
                defaultValue="default"
                style={{ width: 120, marginLeft: 4, marginRight: 4 }}
                size="small"
                onChange={handleFontFamily}
                popupMatchSelectWidth={false}
                value={editor.isActive('textStyle') ?
                  (editor.getAttributes('textStyle').fontFamily || 'default') :
                  'default'}
              >
                <Option value="default">Times New Roman</Option>
                <Option value="'Times New Roman', Times, serif" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</Option>
                <Option value="'Courier New', Courier, monospace" style={{ fontFamily: 'Courier New' }}>Courier New</Option>
                <Option value="Arial, Helvetica, sans-serif" style={{ fontFamily: 'Arial' }}>Arial</Option>
              </Select>
            </Tooltip>

            <Tooltip title="Insert Image">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleImageUpload}
                className="image-upload-button"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<PictureOutlined />}
                />
              </Upload>
            </Tooltip>

          </div>
          <EditorContent 
            editor={editor} 
            style={{ 
              padding: 0,
              minHeight: '34px',
              background: token.colorBgContainer,
              outline: 'none',
              position: 'relative'
            }} 
          />
        </div>
      </Card>
    </div>
  );
};

export default CompactRichTextEditor; 