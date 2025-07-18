import React, { useState } from "react";
import { Table } from "antd";
import AnswerGrid from "./AnswerGrid";

const columns = (answerKey) => [
  { title: 'FIRSTNAME', dataIndex: 'firstName', key: 'firstName' },
  { title: 'LASTNAME', dataIndex: 'lastName', key: 'lastName' },
  { title: 'ID', dataIndex: 'studentId', key: 'studentId' },
  { title: 'VERSION', dataIndex: 'versionId', key: 'versionId' },
  {
    title: 'ANSWERS',
    dataIndex: 'answerString',
    key: 'answerString',
    render: (text, record) => {
      const versionId = record.versionId;
      const keyUsed = answerKey?.[versionId];

      //console.log(`Rendering AnswerGrid for versionId: ${versionId}`);
      //console.log(`Answer key:`, answerKey);
      //console.log(`Answer key found:`, keyUsed);

      return (
        <AnswerGrid
          answerString={text}
          answerKeyString={keyUsed || ''}
        />
      );
    }
  }
];

const TeleformTable = ({ data, answerKey = {} }) => {
  const [pageSize, setPageSize] = useState(10);

  const handleShowSizeChange = (current, size) => {
    setPageSize(size);
  };

  return (
    <Table
      columns={columns(answerKey)}
      dataSource={data.map((row, idx) => ({ ...row, key: idx }))}
      pagination={{ 
        pageSize: pageSize, 
        showSizeChanger: true,
        onShowSizeChange: handleShowSizeChange
      }}
      bordered
      scroll={{ x: true }}
    />
  );
};

export default TeleformTable;