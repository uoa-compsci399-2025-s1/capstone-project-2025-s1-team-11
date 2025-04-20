// imports for react and antd ui bits
import React, { useState, useEffect, useMemo } from "react";
import { Button, Typography, Modal, Input, Card, message } from "antd";
import 'quill/dist/quill.snow.css';

message.config({ top: 64 }); // set where the success message appears on the screen

// imports from dnd-kit for drag and drop setup
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

// setting up inputs
const { TextArea } = Input;

// each question or section that can be dragged
const SortableItem = ({ item, index, onEdit, onDelete, activeItemId }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const isDragging = activeItemId === item.id;
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    marginBottom: isDragging ? 4 : 12,
    padding: isDragging ? 4 : 12,
    cursor: "grab",
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'grab',
            marginBottom: 16,
            padding: 8,
            backgroundColor: '#e6f7ff',
            borderRadius: 4,
          }}
          {...listeners}
          {...attributes}
        >
          {item.type === 'section' ? (
            <Typography.Title level={5} style={{ margin: 0 }}>{item.title}</Typography.Title>
          ) : (
            <Typography.Title level={5} style={{ margin: 0 }}>{`Question ${index}`}</Typography.Title>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {item.type === 'question' ? (
            <>
              <Typography.Title level={5}>{item.questionText}</Typography.Title>
              {item.options.map((opt, idx) => {
                const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v'];
                return (
                  <Typography.Paragraph key={idx} style={{ marginBottom: 12 }}>
                    <strong>{romanNumerals[idx]}.</strong> {opt}
                  </Typography.Paragraph>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  aria-label="Edit question"
                  role="button"
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  aria-label="Delete question"
                  role="button"
                >
                  Delete
                </Button>
              </div>
            </>
          ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  aria-label="Edit section"
                  role="button"
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  aria-label="Delete section"
                  role="button"
                >
                  Delete
                </Button>
              </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// main exam display component
const ExamDisplay = ({ exam, onAddQuestion, fileName }) => {
  // state for handling modals and form edits
  const [isBlankModalVisible, setIsBlankModalVisible] = useState(false);
  const [editedQuestionText, setEditedQuestionText] = useState("");
  const [editedSection, setEditedSection] = useState("");
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(0);
  const [editedAnswerText, setEditedAnswerText] = useState("");
  const [examItems, setExamItems] = useState([]); // @type {Array<{id: string, questionText?: string, options?: string[], type: string, section?: string}>}
  const [activeItemId, setActiveItemId] = useState(null);

  const [sectionEditModalOpen, setSectionEditModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionSubtext, setNewSectionSubtext] = useState('');

  // group questions and sections into a flat list when exam loads
  useEffect(() => {
    if (!exam?.questions?.length) return;

    const items = exam.questions.reduce((acc, q) => {
      const sec = q.section || "Unsectioned";
      if (!acc.find(item => item.id === sec)) {
        acc.push({ id: sec, title: sec, type: 'section' });
      }
      acc.push({ id: q.id, questionText: q.questionText, options: q.options, type: 'question', section: sec });
      return acc;
    }, []);

    setExamItems(items);
  }, [exam]);

  // Compute question indexes using useMemo for performance
  const questionIndexes = useMemo(() => {
    const indexes = {};
    let questionCounter = 0;
    examItems.forEach((item) => {
      if (item.type === 'question') {
        indexes[item.id] = ++questionCounter;
      }
    });
    return indexes;
  }, [examItems]);

  // opens the edit modal
  const handleEdit = (item) => {
    if (item.type === 'question') {
      setEditedQuestionText(item.questionText);
      setEditedSection(item.section);
      setSelectedAnswerIndex(0);
      setEditedAnswerText((item.options && item.options[0]) || "");
      setIsBlankModalVisible(true);
    } else {
      setNewSectionTitle(item.title);
      setEditingSection(item);
      setSectionEditModalOpen(true);
    }
  };

  // delete question
  const handleDeleteItem = (id) => {
    // backend: remove item from file based on ID
    setExamItems(prev => prev.filter(item => item.id !== id));
    message.success("Changes saved successfully"); // backend: implement saving of updated question/section here
  };

  // bail if there's no exam loaded
  if (!exam) return <div>No exam loaded.</div>;

  return (
    <div>
      {/* exam title and metadata up top */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <Typography.Text strong>Currently editing:</Typography.Text>{" "}
          <Typography.Text>{exam.title}</Typography.Text>
          <br />
          <Typography.Text type="secondary">File: {fileName || "Unknown file"}</Typography.Text>
        </div>
        <span style={{ fontWeight: 500 }}>Date: {exam.date}</span>
      </div>

      {/* drag and drop setup for all items */}
      <DndContext
        sensors={useSensors(
          useSensor(PointerSensor),
          useSensor(KeyboardSensor)
        )}
        collisionDetection={closestCenter}
        dropAnimation={{
          duration: 250,
          easing: 'ease',
        }}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={({ active }) => {
          setActiveItemId(active.id);
        }}
        onDragEnd={({ active, over }) => {
          setActiveItemId(null);
          if (!over || active.id === over.id) return;

          const updated = arrayMove(examItems, examItems.findIndex(item => item.id === active.id), examItems.findIndex(item => item.id === over.id));
          // backend: persist new item order in file after drag-and-drop
          setExamItems(updated);
          message.success("Changes saved successfully"); // backend: implement saving of updated question/section here
        }}
      >
        <DragOverlay>
          {activeItemId ? (
            <Card
              size="small"
              style={{
                transform: 'scale(0.95)',
                transition: 'transform 0.15s ease-in-out',
                backgroundColor: '#fffbe6',
                border: '1px dashed #d9d9d9',
                padding: 8,
              }}
            >
              <div>
                {(() => {
                  const item = examItems.find(i => i.id === activeItemId);
                  if (!item) return null;
                  return item.type === 'section' ? item.title : item.questionText;
                })()}
              </div>
            </Card>
          ) : null}
        </DragOverlay>
        <SortableContext
          items={examItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {examItems.map((item, index) => {
            return (
              <SortableItem
                key={item.id}
                item={item}
                index={item.type === 'question' ? questionIndexes[item.id] : null}
                onEdit={handleEdit}
                onDelete={handleDeleteItem}
                activeItemId={activeItemId}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      {/* buttons at the bottom for adding and deleting */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 16 }}>
        <Button
          type="dashed"
          onClick={() => {
            // backend: add a new blank question to the file
            onAddQuestion();
            message.success("Changes saved successfully");
          }}
        >
          Add Question
        </Button>
        <Button
          type="dashed"
          onClick={() => {
            // backend: add new section break to file with default title
            const newSection = {
              id: `section-${Date.now()}`,
              title: `New Section Break ${examItems.length}`,
              type: 'section',
            };
            setExamItems([...examItems, newSection]);
            message.success("Changes saved successfully");
          }}
          style={{ marginTop: 16 }}
        >
          Add Section Break
        </Button>
      </div>

      {/* modal for editing question content */}
      <Modal
        title="Edit Question"
        open={isBlankModalVisible}
        onCancel={() => setIsBlankModalVisible(false)}
        okText="Save"
        onOk={() => {
          // backend: save updated question text and answers to file
          setExamItems(prev => prev.map(item => {
            if (item.id === activeItemId) {
              return { ...item, questionText: editedQuestionText, options: item.options.map((opt, idx) => idx === selectedAnswerIndex ? editedAnswerText : opt) };
            }
            return item;
          }));
          setIsBlankModalVisible(false);
          message.success("Changes saved successfully"); // backend: implement saving of updated question/section here
        }}
      >
        <Typography.Text style={{ marginBottom: 16 }}>Update the question text below:</Typography.Text>
        <TextArea
          value={editedQuestionText}
          onChange={(e) => setEditedQuestionText(e.target.value)}
          placeholder="Edit question text"
          style={{ marginBottom: 16 }}
        />
        <Typography.Text style={{ marginBottom: 16 }}>Choose which answer you want to edit:</Typography.Text>
        <Input
          value={selectedAnswerIndex}
          onChange={setSelectedAnswerIndex}
          placeholder="Select answer to edit"
          style={{ width: "100%", marginTop: 16, marginBottom: 16 }}
        >
          {(examItems.find(item => item.id === activeItemId)?.options || []).map((opt, idx) => {
            const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v'];
            return (
              <Option key={idx} value={idx}>{`${romanNumerals[idx]}. ${opt}`}</Option>
            );
          })}
        </Input>
        <Typography.Text style={{ marginBottom: 16 }}>Edit the selected answer:</Typography.Text>
        <Input
          value={editedAnswerText}
          onChange={(e) => setEditedAnswerText(e.target.value)}
          placeholder="Edit answer text"
          style={{ marginTop: 16, marginBottom: 16 }}
        />
      </Modal>

      {/* modal for editing section content */}
      <Modal
        title="Edit Section Break"
        open={sectionEditModalOpen}
        onOk={() => {
          // backend: save updated section title and subtext to file
          setExamItems(prev => prev.map(item => {
            if (item.id === editingSection.id) {
              return { ...item, title: newSectionTitle };
            }
            return item;
          }));
          setSectionEditModalOpen(false);
          message.success("Changes saved successfully"); // backend: implement saving of updated question/section here
        }}
        onCancel={() => setSectionEditModalOpen(false)}
        okText="Save"
      >
        <Typography.Text style={{ marginBottom: 16 }}>Edit the section title below:</Typography.Text>
        <Input
          placeholder="Section title"
          value={newSectionTitle}
          onChange={e => setNewSectionTitle(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Typography.Text style={{ marginBottom: 16 }}>Update the section description or instructions below:</Typography.Text>
        <TextArea
          value={newSectionSubtext}
          onChange={(e) => setNewSectionSubtext(e.target.value)}
          placeholder="Edit section subtext"
          style={{ marginBottom: 16 }}
        />
      </Modal>
    </div>
  );
};

export default ExamDisplay;
