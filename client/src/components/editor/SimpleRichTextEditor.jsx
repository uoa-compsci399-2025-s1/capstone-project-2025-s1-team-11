import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
//import { BsTypeBold, BsTypeUnderline, BsTypeItalic } from "react-icons/bs";
//import Placeholder from "@tiptap/extension-placeholder";

//import { BsLink45Deg } from "react-icons/bs";
//import { BiUnlink } from "react-icons/bi";
import "../editor/SimpleRichTextEditor.css";
//import { AddImageLink } from "./Image/AddImageLink";
//import { RiImageAddFill } from "react-icons/ri";
//import { AddMeme } from "./meme/AddMeme";
//import { AddLinkBox } from "./link/AddLinkBox";
//import { TextOperation } from "./text/TextOperations";

export const SimpleRichTextEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit, Underline, Image],
    autofocus: false
  });

  return (
    <div className="container">
      <div className="btn-array gap-1 mtb1-rem">
        <div className="flex">
        <button
          title="bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}
        >
          {/* <BsTypeBold size={28} /> */}
        </button>
        <button
          title="Italics"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}
        >
          {/* <BsTypeItalic size={28} /> */}
        </button>
        <button
          title="underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}
        >
          {/* <BsTypeUnderline size={28} /> */}
        </button>
      </div>
      <div className="flex">
        <div className="relative" onMouseLeave={() => setImageModal(false)}>
          <button onClick={() => setImageModal(true)}>
            {/* <RiImageAddFill size={28} /> */}
          </button>
          {/* {imageModal && (
            <AddImageLink
              editor={editor}
              modal={imageModal}
              setModal={setImageModal}
            />
          )} */}
        </div>
        <div className="relative" onMouseLeave={() => setModal(false)}>
          {editor.isActive("link") ? (
            <button
              className="unlink"
              title="Remove link"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              {/* <BiUnlink size={28} /> */}
            </button>
          ) : (
            <button title="add a link" onClick={() => setModal(true)}>
              {/* <BsLink45Deg size={28} /> */}
            </button>
          )}
          {/* {modal && (
            <AddLinkBox editor={editor} modal={modal} setModal={setModal} />
          )} */}
        </div>
        {/* <AddMeme editor={editor} /> */}
      </div>
      <EditorContent editor={editor} />
    </div></div>
  );
};

export default SimpleRichTextEditor; 