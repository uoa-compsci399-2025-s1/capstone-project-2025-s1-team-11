import React from 'react';
import { Card, Divider, Badge, List, Button, Typography, Collapse, Tooltip } from 'antd';
import { ProfileOutlined, FileTextOutlined, RightCircleOutlined } from '@ant-design/icons';
import { htmlToText } from '../utilities/textUtils';

const { Title, Text } = Typography;

const ExamSidebar = ({ exam, currentItemId, onNavigateToItem }) => {
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
            <ProfileOutlined /> {section.sectionNumber || section.sectionTitle}
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
            <List.Item
              key={question.id}
              className={currentItemId === question.id ? 'highlighted-item' : ''}
              onClick={() => onNavigateToItem(question.id, 'question')}
              style={{ cursor: 'pointer' }}
            >
              <Tooltip title={question.text}>
                <Text style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Q{qIndex + 1}: {question.text}
                </Text>
              </Tooltip>
              <Badge count={question.marks} style={{ backgroundColor: '#1890ff' }} />
            </List.Item>
          )}
        />
      )
    }));

  return (
    <Card className="exam-sidebar" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      <div style={{ marginBottom: '8px' }}>
        <Title level={4} style={{ margin: 0 }}>Exam Overview</Title>
      </div>
      <Divider style={{ margin: '12px 0' }} />

      <div className="exam-stats">
        <Title level={5}>Statistics</Title>
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

      <Title level={5}>Structure</Title>
      <Collapse defaultActiveKey={['0']} ghost items={collapseItems} />

      {/* Standalone questions (not in a section) */}
      {examStructure.filter(item => item.type === 'question').map((item, index) => (
        <List.Item
          key={index}
          className={currentItemId === item.id ? 'highlighted-item' : ''}
          onClick={() => onNavigateToItem(item.id, 'question')}
          style={{ cursor: 'pointer', padding: '8px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Tooltip title={item.text}>
              <Text style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <FileTextOutlined /> {item.text}
              </Text>
            </Tooltip>
            <Badge count={item.marks} style={{ backgroundColor: '#1890ff' }} />
          </div>
        </List.Item>
      ))}

      <Divider style={{ margin: '12px 0' }} />

      <div className="section-distribution">
        <Title level={5}>Questions by Section</Title>
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