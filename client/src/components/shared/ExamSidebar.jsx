import React from 'react';
import { Card, Divider, Badge, List, Button, Typography, Collapse, Tooltip, Tag } from 'antd';
import { ProfileOutlined, FileTextOutlined, RightCircleOutlined, EditOutlined } from '@ant-design/icons';
import { htmlToText } from '../../utilities/textUtils';

const { Title, Text, Paragraph } = Typography;

// Memoized QuestionItem component to prevent unnecessary re-renders
const QuestionItem = React.memo(({ question, qIndex, currentItemId, onNavigateToItem }) => {
  return (
    <List.Item
      key={question.id}
      className={currentItemId === question.id ? 'highlighted-item' : ''}
      onClick={() => onNavigateToItem(question.id, 'question')}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ width: '100%' }}>
        <Paragraph
          ellipsis={{
            rows: 1,
            tooltip: question.text
          }}
          style={{ margin: 0, maxWidth: '90%' }}
        >
          Q{qIndex + 1}: {question.text}
        </Paragraph>
      </div>
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
      style={{ cursor: 'pointer', padding: '8px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flex: 1, marginRight: '8px' }}>
          <Paragraph
            ellipsis={{
              rows: 1,
              tooltip: item.text
            }}
            style={{ margin: 0 }}
          >
            <FileTextOutlined /> {item.text}
          </Paragraph>
        </div>
        <Badge count={item.marks} style={{ backgroundColor: '#1890ff' }} />
      </div>
    </List.Item>
  );
});

const ExamSidebar = ({ exam, currentItemId, onNavigateToItem, onEditDetails }) => {
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

  // Convert structure to Collapse items
  const collapseItems = examStructure
    .filter(item => item.type === 'section')
    .map((section, index) => ({
      key: String(index),
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span>
            <ProfileOutlined /> {section.sectionTitle || section.sectionNumber}
          </span>
          <Badge count={section.questions.length} style={{ backgroundColor: '#52c41a' }} />
        </div>
      ),
      extra: (
        <Button
          type="text"
          size="small"
          icon={<RightCircleOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToItem(section.id, 'section');
          }}
        />
      ),
      children: (
        <List
          size="small"
          dataSource={section.questions}
          renderItem={(question, qIndex) => (
            <QuestionItem
              question={question}
              qIndex={qIndex}
              currentItemId={currentItemId}
              onNavigateToItem={onNavigateToItem}
            />
          )}
        />
      )
    }));

  return (
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
      <Collapse defaultActiveKey={['0']} ghost items={collapseItems} />

      {/* Standalone questions (not in a section) */}
      {examStructure.filter(item => item.type === 'question').map((item, index) => (
        <StandaloneQuestionItem
          key={index}
          item={item}
          currentItemId={currentItemId}
          onNavigateToItem={onNavigateToItem}
        />
      ))}

      <Divider style={{ margin: '12px 0' }} />

      <div className="section-distribution">
        <Paragraph strong style={{ fontSize: '16px', marginBottom: 8 }}>Questions by Section</Paragraph>
        <List
          size="small"
          dataSource={stats.questionsPerSection}
          renderItem={(section) => (
            <List.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Tooltip title={section.sectionTitle}>
                  <Text style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {section.sectionNumber || section.sectionTitle}
                  </Text>
                </Tooltip>
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
  );
};

export default ExamSidebar;