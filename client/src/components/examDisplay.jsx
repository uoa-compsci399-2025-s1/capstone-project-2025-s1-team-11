import React, { useState, useEffect, useMemo } from "react";
import { Button, Typography, Modal, Input, Card, message } from "antd";
import 'quill/dist/quill.snow.css';
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

const { TextArea } = Input;

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
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>{item.title}</Typography.Title>
              {item.subtext && (
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                  {item.subtext}
                </Typography.Paragraph>
              )}
            </div>
          ) : (
            <Typography.Title level={5} style={{ margin: 0 }}>{`Question ${index}`}</Typography.Title>
          )}
        </div>

        {item.type === 'question' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {item.section && (
              <Typography.Text type="secondary" style={{ fontStyle: "italic" }}>
                {item.section}
              </Typography.Text>
            )}
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
              <Button size="small" onClick={() => onEdit(item)}>Edit</Button>
              <Button size="small" danger onClick={() => onDelete(item.id)}>Delete</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const ExamDisplay = ({ exam, onAddQuestion, fileName }) => {
  const [examItems, setExamItems] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);

  useEffect(() => {
    if (!exam?.examBody?.length) return;

    const items = [];

    exam.examBody.forEach((entry) => {
      if (entry.type === "section") {
        items.push({
          id: entry.id,
          type: "section",
          title: entry.title,
          subtext: entry.subtext,
        });

        (entry.questions || []).forEach((q) => {
          items.push({
            ...q,
            section: entry.title,
          });
        });
      } else if (entry.type === "question") {
        items.push(entry);
      }
    });

    setExamItems(items);
  }, [exam]);

  const questionIndexes = useMemo(() => {
    const indexes = {};
    let count = 0;
    examItems.forEach(item => {
      if (item.type === 'question') {
        indexes[item.id] = ++count;
      }
    });
    return indexes;
  }, [examItems]);

  const handleEdit = (item) => {
    message.info(`Edit triggered for ${item.type}: ${item.id}`);
  };

  const handleDeleteItem = (id) => {
    setExamItems(prev => prev.filter(item => item.id !== id));
    message.success("Item deleted");
  };

  if (!exam) return <div>No exam loaded.</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3}>{exam.examTitle}</Typography.Title>
        <Typography.Text type="secondary">
          {exam.courseCode} - {exam.courseName} | {exam.semester} {exam.year}
        </Typography.Text>
      </div>

      <DndContext
        sensors={useSensors(
          useSensor(PointerSensor),
          useSensor(KeyboardSensor)
        )}
        collisionDetection={closestCenter}
        dropAnimation={{ duration: 250, easing: 'ease' }}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragStart={({ active }) => setActiveItemId(active.id)}
        onDragEnd={({ active, over }) => {
          setActiveItemId(null);
          if (!over || active.id === over.id) return;

          const updated = arrayMove(
            examItems,
            examItems.findIndex(i => i.id === active.id),
            examItems.findIndex(i => i.id === over.id)
          );
          setExamItems(updated);
          message.success("Reordered");
        }}
      >
        <DragOverlay>
          {activeItemId && (
            <Card size="small">
              {(() => {
                const item = examItems.find(i => i.id === activeItemId);
                return item?.type === 'section' ? item.title : item.questionText;
              })()}
            </Card>
          )}
        </DragOverlay>

        <SortableContext items={examItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {examItems.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={item.type === 'question' ? questionIndexes[item.id] : null}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
              activeItemId={activeItemId}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button type="dashed" onClick={onAddQuestion}>Add Question</Button>
        <Button type="dashed" onClick={() => {
          const newSection = {
            id: `section-${Date.now()}`,
            title: `Untitled Section`,
            subtext: "Instructions...",
            type: "section",
          };
          setExamItems([...examItems, newSection]);
          message.success("Section added");
        }}>Add Section</Button>
      </div>
    </div>
  );
};

export default ExamDisplay;