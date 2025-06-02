import React from 'react';
import { Card, Divider, Badge, List, Button, Typography, Collapse, Tooltip, Tag } from 'antd';
import { ProfileOutlined, RightCircleOutlined, EditOutlined } from '@ant-design/icons';
import { htmlToText } from '../../utilities/textUtils';
import { useSelector } from 'react-redux';
import { selectFileName } from '../../store/exam/selectors';

const { Title, Text, Paragraph } = Typography;

const QuestionItem = React.memo(({ question, currentItemId, onNavigateToItem }) => {
  try {
    const textContent = htmlToText(question.text);
    return (
      <List.Item
        key={question.id}
        className={currentItemId === question.id ? 'highlighted-item' : ''}
        onClick={() => onNavigateToItem(question.id, 'question')}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Tooltip title={textContent} placement="topLeft" mouseEnterDelay={0.2}>
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
            Q{question.questionNumber}: {textContent}
          </div>
        </Tooltip>
        <Badge count={question.marks} style={{ backgroundColor: '#1890ff' }} />
      </List.Item>
    );
  } catch (error) {
    return <List.Item>Error rendering question</List.Item>;
  }
});

const StandaloneQuestionItem = React.memo(({ item, currentItemId, onNavigateToItem }) => {
  try {
    const textContent = htmlToText(item.text);
    return (
      <List.Item
        className={currentItemId === item.id ? 'highlighted-item' : ''}
        onClick={() => onNavigateToItem(item.id, 'question')}
        style={{ cursor: 'pointer', padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Tooltip title={textContent} placement="topLeft" mouseEnterDelay={0.2}>
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
            Q{item.questionNumber}: {textContent}
          </div>
        </Tooltip>
        <Badge count={item.marks} style={{ backgroundColor: '#1890ff' }} />
      </List.Item>
    );
  } catch (error) {
    return <List.Item>Error rendering question</List.Item>;
  }
});

const ExamSidebar = ({ exam, currentItemId, onNavigateToItem, onEditDetails }) => {
  const fileName = useSelector(selectFileName);

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
          text: htmlToText(q.contentFormatted || ''),
          marks: q.marks || 1,
          questionNumber: q.questionNumber,
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
        text: htmlToText(item.contentFormatted || ''),
        marks: item.marks || 1,
        questionNumber: item.questionNumber,
        index
      });
    }
  });

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
          <List.Item>
            <Text type="secondary">File:</Text>
            <Tooltip title="Full file path not available due to browser privacy restrictions.">
              <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                {fileName || '[unsaved file]'}
              </Text>
            </Tooltip>
          </List.Item>

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
                        <ProfileOutlined /> {item.sectionTitle || `Section ${item.sectionNumber}`}
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
                    <List
                      size="small"
                      dataSource={item.questions}
                      renderItem={(question) => (
                        <QuestionItem
                          question={question}
                          currentItemId={currentItemId}
                          onNavigateToItem={onNavigateToItem}
                        />
                      )}
                    />
                  )
                }]}
                defaultActiveKey={[String(index)]}
              />
            </div>
          );
        } else if (item.type === 'question') {
          return (
            <div key={item.id} style={{ marginBottom: '4px' }}>
              <StandaloneQuestionItem
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
  );
};

export default ExamSidebar;