import React from "react";
import { Table } from "antd";
import AnswerGrid from "./AnswerGrid";

const columns = [
  { title: 'FIRSTNAME', dataIndex: 'firstName', key: 'firstName' },
  { title: 'LASTNAME', dataIndex: 'lastName', key: 'lastName' },
  { title: 'ID', dataIndex: 'studentId', key: 'studentId' },
  { title: 'VERSION', dataIndex: 'versionId', key: 'versionId' },
  {
    title: 'ANSWERS',
    dataIndex: 'answerString',
    key: 'answerString',
    render: (text) => <AnswerGrid answerString={text} />
  }
];

const TeleformTable = ({ data }) => (
  <Table
    columns={columns}
    dataSource={data.map((row, idx) => ({ ...row, key: idx }))}
    pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: ['5', '10', '20'] }}
    bordered
    scroll={{ x: true }}
  />
);

export default TeleformTable;