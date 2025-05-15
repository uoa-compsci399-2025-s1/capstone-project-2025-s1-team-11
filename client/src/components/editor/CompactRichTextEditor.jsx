import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import { Extension } from '@tiptap/core';
import { Button, Tooltip, message, Select, Upload, Slider } from 'antd';
import {
  BoldOutlined, ItalicOutlined, UnderlineOutlined,
  AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, EnterOutlined,
  PictureOutlined
} from '@ant-design/icons';
import './CompactRichTextEditor.css';

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

const CompactRichTextEditor = ({ content, onChange, placeholder = 'Enter content...', imageScale, onImageScaleChange }) => {
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
        paragraph: true,
      }),
      Underline.configure({
        HTMLAttributes: {
          style: 'text-decoration: underline'
        },
      }),
      TextStyle.configure({
        types: ['textStyle'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Typography,
      CustomIndentExtension,
      Image.configure({
        allowBase64: true,
        inline: false,
        HTMLAttributes: {
          // class: 'content-image', // Optional class for general styling
        },
        addAttributes() {
          return {
            // Ensure Tiptap's default attributes like src, alt, title are kept.
            // This spread might need to be this.parentAttrs or similar depending on Tiptap version specifics
            // For Tiptap 2, it usually inherits default attributes automatically.
            // Let's assume defaults are kept and just add ours.
            src: { default: null },
            alt: { default: null },
            title: { default: null },

            customWidth: {
              default: '100%', // Default to 100% if no specific width is set
              parseHTML: element => {
                let widthToStore = '100%';
                if (element.style.width && element.style.width.includes('%')) {
                  widthToStore = element.style.width;
                } else if (element.getAttribute('width') && element.getAttribute('width').includes('%')) {
                  widthToStore = element.getAttribute('width');
                }
                // Note: We are not parsing pixel widths into percentages here for simplicity.
                return widthToStore;
              },
              renderHTML: attributes => {
                // This style will be applied to the <img> tag in the editor and in getHTML()
                return { style: `width: ${attributes.customWidth || '100%'}; height: auto;` };
              },
            },
          };
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'compact-editor-content',
        spellcheck: 'false',
        style: `--image-scale-percent: ${imageScale}%;`
      },
    },
  });

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
      <div className="compact-editor-toolbar">
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

        {onImageScaleChange && (
          <Tooltip title={`Image Scale: ${imageScale}%`}>
            <Slider 
              min={40} 
              max={100} 
              value={imageScale} 
              onChange={onImageScaleChange} 
              style={{ width: '70px', marginLeft: '8px', marginRight: '4px'}}
              tipFormatter={value => `${value}%`}
            />
          </Tooltip>
        )}

      </div>
      <EditorContent editor={editor} className="compact-editor-content-wrapper" />
    </div>
  );
};

export default CompactRichTextEditor; 