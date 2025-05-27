import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
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
          background-color: #f0f0f0;
          border-bottom: 1px solid #d9d9d9;
          padding: 4px;
          border-top-left-radius: 2px;
          border-top-right-radius: 2px;
        }
        .ProseMirror {
          min-height: 34px;
          padding: 8px 12px !important;
          margin: 0 !important;
        }
        .ProseMirror p {
          margin: 0;
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
  }, []);
  
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
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'display: inline; vertical-align: baseline;'
        }
      }),
      CustomResizableExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
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
            //console.log('Resize mouseup detected');
            //console.log('Current doc content:', view.state.doc.toJSON());
            onChange(view.state.doc.content.toJSON());
          }
        }
      }
    },
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
          //console.log('Image size changed - triggering update');
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
        editor.chain().focus().setImage({ src: dataUrl }).run();
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
          }
        }}
        bodyStyle={{ padding: 0 }}
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
                <Option value="default">Default</Option>
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