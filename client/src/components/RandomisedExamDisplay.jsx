//unused, can probs be deleted

import React, { useState } from "react";
import { Typography, Tabs, Table } from "antd";

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

// utility to shuffle array
const shuffle = (arr) => {
  let copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const baseData = () => {
  let data = [];
  let sectionCount = 1;
  let questionNumber = 1;

  const sectionTitles = [
    "Endocrine Hormones",
    "Insulin & Glucose Regulation",
    "Stress Hormones & Exercise",
    "Posterior Pituitary Hormones"
  ];

  const questions = [
    "What hormone is released from the anterior pituitary during exercise?",
    "How does insulin affect glucose uptake in skeletal muscle?",
    "What are the physiological effects of cortisol during prolonged exercise?",
    "Which gland secretes antidiuretic hormone (ADH)?",
    "What is the role of growth hormone during resistance training?",
    "How does the sympathetic nervous system affect heart rate?",
    "Which hormone promotes lipolysis during endurance activity?",
    "How does exercise intensity affect catecholamine release?",
    "What triggers the secretion of aldosterone?",
    "Describe the feedback loop involving the hypothalamus and anterior pituitary."
  ];

  const answersList = [
    "Growth hormone", 
    "Insulin promotes glucose uptake by activating GLUT4 transporters", 
    "Cortisol increases gluconeogenesis and suppresses inflammation", 
    "Posterior pituitary", 
    "Stimulates protein synthesis and muscle growth", 
    "Increases heart rate and contractility", 
    "Epinephrine", 
    "Increased intensity raises catecholamine levels", 
    "Low blood pressure or sodium", 
    "Negative feedback via hypothalamic-pituitary-adrenal axis"
  ];

  // Map section indices to the question indices where they should be inserted
  // Section before question 4 (index 3), 7 (index 6), and 10 (index 9)
  let sectionInsertIndices = [3, 6, 9];
  let sectionIndex = 1;

  for (let i = 0; i < questions.length; i++) {
    // Insert a section BEFORE these indices
    if (sectionInsertIndices.includes(i)) {
      data.push({
        key: `section-${sectionIndex}`,
        number: "",
        question: sectionTitles[sectionIndex] || `Section ${sectionIndex + 1}`,
        isSection: true,
      });
      sectionIndex++;
    }

    data.push({
      key: `q-${questionNumber}`,
      number: questionNumber,
      question: questions[questionNumber - 1],
      answers: [answersList[questionNumber - 1]],
      isSection: false,
    });

    questionNumber++;
  }

  return data;
};

const generateVersions = () => {
  const base = baseData();
  return [1, 2, 3, 4].map(() =>
    base.map((item) => {
      if (item.isSection) {
        return { ...item };
      } else {
        // For uniqueness and context validity, we will shuffle the answers array which contains only one correct answer.
        // To provide multiple options, we can create plausible distractors by mixing other answers.
        // We'll create an options array consisting of the correct answer and 4 other random answers from answersList excluding the correct one.
        const allAnswers = [
          "Growth hormone", 
          "Insulin promotes glucose uptake by activating GLUT4 transporters", 
          "Cortisol increases gluconeogenesis and suppresses inflammation", 
          "Posterior pituitary", 
          "Stimulates protein synthesis and muscle growth", 
          "Increases heart rate and contractility", 
          "Epinephrine", 
          "Increased intensity raises catecholamine levels", 
          "Low blood pressure or sodium", 
          "Negative feedback via hypothalamic-pituitary-adrenal axis"
        ];
        const correctAnswer = item.answers[0];
        const distractors = allAnswers.filter(ans => ans !== correctAnswer);
        // Shuffle distractors and take first 4
        const shuffledDistractors = shuffle(distractors).slice(0,4);
        const options = shuffle([correctAnswer, ...shuffledDistractors]);

        return {
          ...item,
          i: options[0],
          ii: options[1],
          iii: options[2],
          iv: options[3],
          v: options[4],
        };
      }
    })
  );
};

const columns = [
  {
    title: "#",
    dataIndex: "number",
    key: "number",
    width: 60,
    onCell: () => ({
      style: { fontSize: "12px" },
    }),
  },
  {
    title: "Question",
    dataIndex: "question",
    key: "question",
    onCell: () => ({
      style: { fontSize: "12px" },
    }),
    render: (text, record) =>
      record.isSection ? (
        <Paragraph
          strong
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: "bold",
            backgroundColor: "#f5f5f5",
            padding: "4px 8px",
            borderRadius: "4px",
          }}
        >
          {text}
        </Paragraph>
      ) : (
        <Paragraph style={{ margin: 0, fontSize: "12px" }}>{text}</Paragraph>
      ),
  },
  {
    title: "i",
    dataIndex: "i",
    key: "i",
    width: 200,
    onCell: () => ({
      style: { fontSize: "12px" },
    }),
  },
  {
    title: "ii",
    dataIndex: "ii",
    key: "ii",
    width: 200,
    onCell: () => ({
      style: { fontSize: "12px" },
    }),
  },
  {
    title: "iii",
    dataIndex: "iii",
    key: "iii",
    width: 200,
    onCell: () => ({
      style: { fontSize: "12px" },
    }),
  },
  {
    title: "iv",
    dataIndex: "iv",
    key: "iv",
    width: 200,
    onCell: () => ({
      style: { fontSize: "12px" },
    }),
  },
  {
    title: "v",
    dataIndex: "v",
    key: "v",
    width: 200,
    onCell: () => ({
      style: { fontSize: "12px" },
    }),
  },
];

const RandomisedExamDisplay = () => {
  const [versions] = useState(generateVersions());

  return (
    <div>
      <Title level={3}>Randomised Exam Versions</Title>
      <Paragraph type="secondary">
        Below are the four randomised versions generated from your uploaded questions. Each version shuffles the answer options while keeping the question consistent.
      </Paragraph>
      <Tabs defaultActiveKey="1">
        {versions.map((data, index) => (
          <TabPane tab={`Version ${index + 1}`} key={index + 1}>
              <Table
                dataSource={data}
                columns={columns}
                pagination={false}
                rowKey="key"
                size="small"
                bordered
                scroll={{ x: 1500 }}
                sticky
              />
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default RandomisedExamDisplay;
