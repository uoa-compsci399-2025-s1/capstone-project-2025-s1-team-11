import React from "react";
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
    render: (text) => <AnswerGrid answerString={text} answerKey={answerKey} />
  }
];

const TeleformTable = ({ data, answerKey }) => (
  <Table
    columns={columns(answerKey)}
    dataSource={data.map((row, idx) => ({ ...row, key: idx }))}
    pagination={{ pageSize: 5, showSizeChanger: true }}
    bordered
    scroll={{ x: true }}
  />
);

export default TeleformTable;