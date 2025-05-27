import React, { useState, useMemo } from 'react';
import { Table, InputNumber, Checkbox, Button, Typography, Tag, Space, Tooltip } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { selectExamData } from '../store/exam/selectors';
import { updateQuestion, removeQuestion } from '../store/exam/examSlice';
import { htmlToText } from '../utilities/textUtils';

const { Paragraph, Title } = Typography;

const SummaryTable = () => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  const tableData = Array.isArray(exam?.examBody) ? exam.examBody.flatMap((entry, examBodyIndex) => {
    if (entry.type === "section" && Array.isArray(entry.questions)) {
      return entry.questions.map((q, questionsIndex) => ({
        ...q,
        examBodyIndex,
        questionsIndex
      }));
    } else if (entry.type !== "section") {
      return [{
        ...entry,
        examBodyIndex,
        questionsIndex: null
      }];
    }
    return [];
  }) : [];
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);

  const processedQuestions = useMemo(() => {
    return (tableData || []).filter(item => item?.type !== "section").map(item => {
      const answers = Array.isArray(item.answers) ? item.answers : [];
      const hasEmptyAnswer = answers.some(a => !(a?.contentFormatted || "").trim());
      const question = htmlToText(item.contentFormatted || "");
      const isEmptyQuestion = !question.trim();
      const marks = item.marks ?? 0;

      const flags = [];
      if (isEmptyQuestion) flags.push("Empty question");
      if (hasEmptyAnswer) flags.push("Empty answer");
      if (marks === 0) flags.push("No marks given");

      return {
        ...item,
        id: item.id || `${item.examBodyIndex}-${item.questionsIndex}`,
        answerCount: answers.length,
        correctCount: answers.filter(a => a.correct).length,
        flags,
        questionNumber: item.questionNumber || `${item.examBodyIndex + 1}.${(item.questionsIndex ?? 0) + 1}`,
        marks,
        question
      };
    });
  }, [tableData]);

  // Apply filter for flagged questions if toggled
  const filteredData = useMemo(() => (
    showOnlyFlagged
      ? processedQuestions.filter(q => Array.isArray(q.flags) && q.flags.length > 0)
      : processedQuestions
  ), [processedQuestions, showOnlyFlagged]);

  // Calculate summary stats
  const totalMarks = useMemo(() =>
    processedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0), [processedQuestions]
  );

  const questionsWithFlags = useMemo(() =>
    processedQuestions.filter(q => Array.isArray(q.flags) && q.flags.length > 0).length, [processedQuestions]
  );

  const handleMarksChange = (value, record) => {
    dispatch(updateQuestion({
      location: {
        examBodyIndex: record.examBodyIndex,
        questionsIndex: record.questionsIndex,
        questionId: record.id
      },
      newData: { marks: value }
    }));
  };

  const handleDeleteSelected = () => {
    selectedRowKeys.forEach(id => {
      const q = processedQuestions.find(q => q.id === id);
      if (!q) return;
      dispatch(removeQuestion({
        examBodyIndex: q.examBodyIndex,
        questionsIndex: q.questionsIndex
      }));
    });
    setSelectedRowKeys([]);
  };

  const columns = [
    {
      title: 'Question #',
      dataIndex: 'questionNumber',
      key: 'questionNumber',
      width: 120,
      render: (number, record) => {
        const questionText = record.question || '';
        let tooltipText = 'ERROR: Empty question';
        if (questionText.trim()) {
          const index = questionText.indexOf('?');
          tooltipText = index !== -1 ? questionText.slice(0, index + 1) : questionText;
        }
        return (
          <Tooltip title={tooltipText}>
            <span>{number}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Mark',
      dataIndex: 'marks',
      key: 'marks',
      width: 100,
      render: (marks, record) => (
        <InputNumber
          min={0}
          value={marks}
          onChange={val => handleMarksChange(val, record)}
        />
      ),
    },
    {
      title: 'Correct',
      dataIndex: 'correctCount',
      key: 'correctCount',
      width: 100,
      render: count => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Options',
      dataIndex: 'answerCount',
      key: 'answerCount',
      width: 120,
      render: count => (
        <Tag color={count > 0 ? 'blue' : 'red'}>
          {count} {count > 0 ? '(OK)' : '(Invalid)'}
        </Tag>
      ),
    },
    {
      title: 'Flags',
      dataIndex: 'flags',
      key: 'flags',
      render: flags => (
        <Space wrap>
          {(Array.isArray(flags) ? flags : []).map(flag => {
            let color = 'default';
            if (flag === 'Empty question') color = 'red';
            else if (flag === 'Empty answer') color = 'volcano';
            else if (flag === 'No marks given') color = 'purple';
            return <Tag color={color} key={flag}>{flag}</Tag>;
          })}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Title level={4}>Summary</Title>
      <Paragraph style={{ display: 'flex', gap: 32 }}>
        <span>Total Marks: {totalMarks}</span>
        <span>Total Questions: {processedQuestions.length}</span>
        <span>Questions with Flags: {questionsWithFlags}</span>
      </Paragraph>
      <Checkbox
        checked={showOnlyFlagged}
        onChange={e => setShowOnlyFlagged(e.target.checked)}
        style={{ marginBottom: 16 }}
      >
        Show only flagged
      </Checkbox>
      <div style={{ marginBottom: 12 }}>
        <Button danger onClick={handleDeleteSelected} disabled={selectedRowKeys.length === 0}>
          Delete Question(s)
        </Button>
      </div>
      <Table
        rowKey="id"
        dataSource={filteredData}
        columns={columns}
        pagination={false}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />
    </div>
  );
};

export default SummaryTable;