//BM-FIX

import React, { useState, useMemo } from 'react';
import {Table, InputNumber, Button, Typography, Tag, Space, Tooltip, Switch} from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { selectExamData } from '../../store/exam/selectors';
import { updateQuestion, removeQuestion } from '../../store/exam/examSlice';
import { htmlToText } from '../../utilities/textUtils';

const { Paragraph, Title } = Typography;

const SummaryTable = () => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  const tableData = useMemo(() => {
    if (!Array.isArray(exam?.examBody)) return [];
    return exam.examBody.flatMap((entry, examBodyIndex) => {
      if (!entry || !entry.type) return [];
      if (entry.type === "section" && Array.isArray(entry.questions)) {
        return entry.questions.map((q, questionsIndex) => ({
          ...q,
          examBodyIndex,
          questionsIndex
        }));
      }
      return [{
        ...entry,
        examBodyIndex,
        questionsIndex: null
      }];
    });
  }, [exam]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showOnlyFlagged, setShowOnlyFlagged] = useState(false);

  const processedQuestions = useMemo(() => {
    return (tableData || []).filter(item => item?.type !== "section").map(item => {
      const flags = [];
      const answers = Array.isArray(item.answers) ? item.answers : [];
      const hasEmptyAnswer = answers.some(a => !(a?.contentFormatted || "").trim());
      const answerTexts = answers.map(a => htmlToText(a.contentFormatted || "").trim().toLowerCase());
      const seen = new Set();
      const hasDuplicateAnswers = answerTexts.some(text => {
        if (seen.has(text)) return true;
        seen.add(text);
        return false;
      });
      if (hasDuplicateAnswers) flags.push("Duplicate answers");
      const question = htmlToText(item.contentFormatted || "");
      const isEmptyQuestion = !question.trim();
      if (!isEmptyQuestion && question.trim().length < 10) {
        flags.push("Short question");
      }
      const marks = item.marks ?? 0;

      if (isEmptyQuestion) flags.push("Empty question");
      if (hasEmptyAnswer) flags.push("Empty answer");
      if (marks === 0) flags.push("No marks given");
      if (answers.filter(a => a.correct).length === 0) flags.push("No correct answer");
      const correctCount = answers.filter(a => a.correct).length;
      if (correctCount === answers.length && answers.length > 0) {
        flags.push("All answers correct");
      } else if (correctCount > 1) {
        flags.push("Multiple correct answers");
      }
      if (answers.length < 2 || answers.length > 5) flags.push("No options");

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
    const sortedKeys = [...selectedRowKeys];
    sortedKeys.sort((a, b) => {
      const qa = processedQuestions.find(q => q.id === a);
      const qb = processedQuestions.find(q => q.id === b);
      if (!qa || !qb) return 0;
      if (qa.examBodyIndex !== qb.examBodyIndex) {
        return qb.examBodyIndex - qa.examBodyIndex; // descending
      }
      return (qb.questionsIndex ?? 0) - (qa.questionsIndex ?? 0); // descending
    });

    for (const id of sortedKeys) {
      const q = processedQuestions.find(q => q.id === id);
      if (!q) continue;
      dispatch(removeQuestion({
        examBodyIndex: q.examBodyIndex,
        questionsIndex: q.questionsIndex
      }));
    }

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
            else if (flag === 'No correct answer') color = 'orange';
            else if (flag === 'Multiple correct answers') color = 'geekblue';
            else if (flag === 'All answers correct') color = 'geekblue';
            else if (flag === 'No options') color = 'magenta';
            else if (flag === 'Duplicate answers') color = 'cyan';
            else if (flag === 'Short question') color = 'gold';
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
      <label style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 16 }}>
        <Switch
          checked={showOnlyFlagged}
          onChange={checked => setShowOnlyFlagged(checked)}
        />
        <span style={{ marginLeft: 8 }}>Show only flagged</span>
      </label>

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