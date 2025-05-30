import React from 'react';
import { Card, Divider, Badge, List, Button, Typography, Collapse, Tooltip, Tag } from 'antd';
import { ProfileOutlined, FileTextOutlined, RightCircleOutlined, EditOutlined } from '@ant-design/icons';
import { htmlToText } from '../utilities/textUtils';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useDispatch } from 'react-redux';
import { moveQuestion } from '../store/exam/examSlice';
import useMessage from '../hooks/useMessage';

const { Title, Text, Paragraph } = Typography;

// Memoized QuestionItem component to prevent unnecessary re-renders
const QuestionItem = React.memo(({ question, qIndex, currentItemId, onNavigateToItem }) => {
  return (
    <List.Item
      key={question.id}
      className={currentItemId === question.id ? 'highlighted-item' : ''}
      onClick={() => onNavigateToItem(question.id, 'question')}
      style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Tooltip title={question.text} placement="topLeft" mouseEnterDelay={0.2}>
        <div
          style={{ 
            margin: 0, 
            flex: 1,
            minWidth: 0, 
            marginRight: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          Q{qIndex + 1}: {question.text}
        </div>
      </Tooltip>
      <Badge count={question.marks} style={{ backgroundColor: '#1890ff' }} />
    </List.Item>
  );
});

// Memoized standalone question item component
const StandaloneQuestionItem = React.memo(({ item, currentItemId, onNavigateToItem }) => {
  return (
    <List.Item
      className={currentItemId === item.id ? 'highlighted-item' : ''}
      onClick={() => onNavigateToItem(item.id, 'question')}
      style={{ cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Tooltip title={item.text} placement="topLeft" mouseEnterDelay={0.5}>
        <div
          style={{ 
            margin: 0,
            flex: 1,
            minWidth: 0, 
            marginRight: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <FileTextOutlined /> {item.text}
        </div>
      </Tooltip>
      <Badge count={item.marks} style={{ backgroundColor: '#1890ff' }} />
    </List.Item>
  );
});

const SortableQuestionItem = ({ question, qIndex, currentItemId, onNavigateToItem, sectionIndex }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    data: {
      type: 'question',
      question,
      sectionIndex,
      questionIndex: qIndex
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <List.Item
        key={question.id}
        className={currentItemId === question.id ? 'highlighted-item' : ''}
        onClick={() => onNavigateToItem(question.id, 'question')}
        {...attributes}
        {...listeners}
        style={{ 
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          width: '100%'
        }}
      >
        <Tooltip title={question.text} placement="topLeft" mouseEnterDelay={0.5}>
          <div
            style={{ 
              margin: 0, 
              flex: 1,
              minWidth: 0, 
              marginRight: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            Q{qIndex + 1}: {question.text}
          </div>
        </Tooltip>
        <Badge count={question.marks} style={{ backgroundColor: '#1890ff' }} />
      </List.Item>
    </div>
  );
};

const SortableStandaloneQuestionItem = ({ item, currentItemId, onNavigateToItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'question',
      item,
      standalone: true
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <List.Item
        className={currentItemId === item.id ? 'highlighted-item' : ''}
        onClick={() => onNavigateToItem(item.id, 'question')}
        {...attributes}
        {...listeners}
        style={{ 
          cursor: 'grab', 
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}
      >
        <Tooltip title={item.text} placement="topLeft" mouseEnterDelay={0.5}>
          <div
            style={{ 
              margin: 0,
              flex: 1,
              minWidth: 0, 
              marginRight: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <FileTextOutlined /> {item.text}
          </div>
        </Tooltip>
        <Badge count={item.marks} style={{ backgroundColor: '#1890ff' }} />
      </List.Item>
    </div>
  );
};

const ExamSidebar = ({ exam, currentItemId, onNavigateToItem, onEditDetails }) => {
  const dispatch = useDispatch();
  const message = useMessage();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, 
    },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    if (activeData.type === 'question' && overData.type === 'question') {
      let source, destination;

      if (activeData.standalone) {
        source = { examBodyIndex: activeData.item.index };
      } else {
        source = { 
          examBodyIndex: activeData.sectionIndex, 
          questionsIndex: activeData.questionIndex 
        };
      }

      if (overData.standalone) {
        destination = { examBodyIndex: overData.item.index };
      } else {
        destination = { 
          examBodyIndex: overData.sectionIndex, 
          questionsIndex: overData.questionIndex 
        };
      }

      dispatch(moveQuestion({ source, destination }));
      message.success("Question moved successfully");
    }
  };

  if (!exam || !exam.examBody || !Array.isArray(exam.examBody)) {
    return (
      <Card className="exam-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">No exam loaded</Text>
        </div>
      </Card>
    );
  }

  const stats = {
    totalSections: 0,
    totalQuestions: 0,
    questionsPerSection: [],
    totalMarks: 0
  };

  // Process exam structure
  const examStructure = [];

  exam.examBody.forEach((item, index) => {
    if (item.type === 'section') {
      stats.totalSections++;
      const questionCount = item.questions?.length || 0;
      stats.totalQuestions += questionCount;
      const sectionMarks = item.questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 0;

      stats.questionsPerSection.push({
        sectionTitle: item.sectionTitle,
        sectionNumber: item.sectionNumber,
        count: questionCount,
        marks: sectionMarks
      });

      examStructure.push({
        id: item.id,
        type: 'section',
        sectionTitle: item.sectionTitle,
        sectionNumber: item.sectionNumber,
        index,
        questions: item.questions?.map((q, qIndex) => ({
          id: q.id,
          type: 'question',
          text: htmlToText(q.contentFormatted || q.contentText || ''),
          marks: q.marks || 1,
          sectionIndex: index,
          questionIndex: qIndex
        })) || []
      });

      stats.totalMarks += sectionMarks;
    } else if (item.type === 'question') {
      stats.totalQuestions++;
      stats.totalMarks += (item.marks || 1);

      examStructure.push({
        id: item.id,
        type: 'question',
        text: htmlToText(item.contentFormatted || item.contentText || ''),
        marks: item.marks || 1,
        index
      });
    }
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={examStructure.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <Card className="exam-sidebar" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Exam Details Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <Title level={4} style={{ margin: 0 }}>Exam Details</Title>
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={onEditDetails}
                size="small"
              />
            </div>
            <List size="small">
              <List.Item>
                <Paragraph style={{ margin: 0 }}>
                  <Text type="secondary">Course Code:</Text>{' '}
                  <Text>{exam?.courseCode || "N/A"}</Text>
                </Paragraph>
              </List.Item>
              <List.Item>
                <Paragraph style={{ margin: 0 }}>
                  <Text type="secondary">Course Name:</Text>{' '}
                  <Text>{exam?.courseName || "N/A"}</Text>
                </Paragraph>
              </List.Item>
              <List.Item>
                <Paragraph style={{ margin: 0 }}>
                  <Text type="secondary">Semester:</Text>{' '}
                  <Text>{exam?.semester || "N/A"}</Text>
                </Paragraph>
              </List.Item>
              <List.Item>
                <Paragraph style={{ margin: 0 }}>
                  <Text type="secondary">Year:</Text>{' '}
                  <Text>{exam?.year || "N/A"}</Text>
                </Paragraph>
              </List.Item>
              {exam?.versions && exam.versions.length > 0 && (
                <List.Item>
                  <Paragraph style={{ margin: 0 }}>
                    <Text type="secondary">Versions:</Text>{' '}
                    <span className="version-tags" style={{ marginLeft: 8 }}>
                      {exam.versions.map((v, i) => <Tag key={i}>{v}</Tag>)}
                    </span>
                  </Paragraph>
                </List.Item>
              )}
            </List>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: '8px' }}>
            <Paragraph strong style={{ fontSize: '16px', marginBottom: 8 }}>Exam Overview</Paragraph>
          </div>
          <Divider style={{ margin: '12px 0' }} />

          <div className="exam-stats">
            <Paragraph strong style={{ fontSize: '16px', marginBottom: 8 }}>Statistics</Paragraph>
            <List size="small">
              <List.Item>
                <Badge color="blue" text={`${stats.totalSections} Sections`} />
              </List.Item>
              <List.Item>
                <Badge color="green" text={`${stats.totalQuestions} Questions`} />
              </List.Item>
              <List.Item>
                <Badge color="orange" text={`${stats.totalMarks} Total Marks`} />
              </List.Item>
            </List>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <Paragraph strong style={{ fontSize: '16px', marginBottom: 8 }}>Structure</Paragraph>
          
          {/* Render questions/sections to be in the same order as in examBody */}
          {examStructure.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div key={item.id} style={{ marginBottom: '8px' }}>
                  <Collapse
                    ghost
                    items={[{
                      key: String(index),
                      label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>
                            <ProfileOutlined /> {item.sectionNumber || item.sectionTitle}
                          </span>
                          <Badge count={item.questions.length} style={{ backgroundColor: '#52c41a' }} />
                        </div>
                      ),
                      extra: (
                        <Button
                          type="text"
                          size="small"
                          icon={<RightCircleOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToItem(item.id, 'section');
                          }}
                        />
                      ),
                      children: (
                        <SortableContext items={item.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                          <List
                            size="small"
                            dataSource={item.questions}
                            renderItem={(question, qIndex) => (
                              <SortableQuestionItem
                                question={question}
                                qIndex={qIndex}
                                currentItemId={currentItemId}
                                onNavigateToItem={onNavigateToItem}
                                sectionIndex={item.index}
                              />
                            )}
                          />
                        </SortableContext>
                      )
                    }]}
                    defaultActiveKey={[String(index)]}
                  />
                </div>
              );
            } else if (item.type === 'question') {
              return (
                <div key={item.id} style={{ marginBottom: '4px' }}>
                  <SortableStandaloneQuestionItem
                    item={item}
                    currentItemId={currentItemId}
                    onNavigateToItem={onNavigateToItem}
                  />
                </div>
              );
            }
            return null;
          })}

          <Divider style={{ margin: '12px 0' }} />

          <div className="section-distribution">
            <Paragraph strong style={{ fontSize: '16px', marginBottom: 8 }}>Questions by Section</Paragraph>
            <List
              size="small"
              dataSource={stats.questionsPerSection}
              renderItem={(section) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div 
                      title={section.sectionTitle}
                      style={{ 
                        width: '100%', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}
                    >
                      {section.sectionNumber || section.sectionTitle}
                    </div>
                    <div>
                      <Badge count={section.count} style={{ backgroundColor: '#52c41a', marginRight: '8px' }} />
                      <Badge count={`${section.marks}m`} style={{ backgroundColor: '#1890ff' }} />
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </Card>
      </SortableContext>
    </DndContext>
  );
};

export default ExamSidebar;