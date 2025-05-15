import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Button, Select } from 'antd';
import { BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons';

const { Option } = Select;

const SimpleRichTextEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold.configure({
        HTMLAttributes: {
          style: 'font-weight: 700;'
        }
      }),
      Italic,
      Underline,
      TextStyle,
      FontFamily,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const toggleMark = (mark) => {
    editor.chain().focus().toggleMark(mark).run();
  };

  const setFontFamily = (value) => {
    if (value === 'default') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(value).run();
    }
  };

  return (
    <div className="simple-editor">
      <div className="simple-editor-toolbar">
        <Button
          type={editor.isActive('bold') ? 'primary' : 'default'}
          icon={<BoldOutlined />}
          onClick={() => toggleMark('bold')}
        />
        <Button
          type={editor.isActive('italic') ? 'primary' : 'default'}
          icon={<ItalicOutlined />}
          onClick={() => toggleMark('italic')}
        />
        <Button
          type={editor.isActive('underline') ? 'primary' : 'default'}
          icon={<UnderlineOutlined />}
          onClick={() => toggleMark('underline')}
        />
        <Select
          defaultValue="default"
          style={{ width: 120 }}
          onChange={setFontFamily}
          value={editor.getAttributes('textStyle').fontFamily || 'default'}
        >
          <Option value="default">Default</Option>
          <Option value="Times New Roman">Times New Roman</Option>
          <Option value="Courier New">Courier New</Option>
          <Option value="Arial">Arial</Option>
        </Select>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default SimpleRichTextEditor; 