import React, { useState, useEffect } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Tooltip } from "antd";
// Helper to strip common LaTeX math delimiters from strings
function stripMathDelimiters(str) {
  if (typeof str !== "string") return str;
  // Remove $...$, $$...$$, \(...\), \[...\] from both ends
  let s = str.trim();
  if ((s.startsWith('$$') && s.endsWith('$$')) ||
      (s.startsWith('\\[') && s.endsWith('\\]'))) {
    return s.slice(2, -2).trim();
  }
  if ((s.startsWith('$') && s.endsWith('$')) ||
      (s.startsWith('\\(') && s.endsWith('\\)'))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

// Helper to split a string into plain text and LaTeX segments (inline math: $...$)
// Returns an array of { type: 'text'|'math', value }
// Enhanced to support block-level math ($$...$$) and inline math ($...$)
// Returns array of { type: 'text'|'math'|'block-math', value }
function splitTextWithMath(input) {
  if (typeof input !== "string") return [{ type: "text", value: input }];
  const result = [];
  let i = 0;
  let curr = "";
  while (i < input.length) {
    // Block math: $$...$$
    if (input[i] === "$" && input[i + 1] === "$") {
      if (curr) {
        result.push({ type: "text", value: curr });
        curr = "";
      }
      let end = input.indexOf("$$", i + 2);
      if (end !== -1) {
        result.push({ type: "block-math", value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      } else {
        // unmatched $$
        curr += "$$";
        i += 2;
        continue;
      }
    }
    // Inline math: $...$
    if (input[i] === "$") {
      if (curr) {
        result.push({ type: "text", value: curr });
        curr = "";
      }
      let end = input.indexOf("$", i + 1);
      // Ignore $$ (already handled above)
      if (end === i + 1) {
        // "$$" found, treat as block math, handled above
        curr += "$";
        i++;
        continue;
      }
      if (end !== -1) {
        result.push({ type: "math", value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      } else {
        // unmatched $
        curr += "$";
        i++;
        continue;
      }
    }
    curr += input[i];
    i++;
  }
  if (curr) result.push({ type: "text", value: curr });
  return result;
}

// Helper to normalize math strings (does not auto-convert a/b to \frac{a}{b})
// Instead, returns info if a suggestion should be made for using \frac
function normalizeMathString(str) {
  if (typeof str !== "string") return str;
  let s = str.trim();
  // Do NOT auto-convert a/b to \frac{a}{b}, but we may suggest it in a tooltip
  return s;
}

// Helper to render string with mixed text and math, supporting inline and block math.
// Block math is rendered as display math (centered, block style).
function renderTextWithMath(input, { inlineMathStyle = {}, blockMathStyle = {} } = {}) {
  // LaTeX error log for proof-of-concept
  if (!window.latexErrors) window.latexErrors = [];
  const segments = splitTextWithMath(input);
  return segments.map((seg, idx) => {
    if (seg.type === "math" || seg.type === "block-math") {
      // Validate math segment
      let latex = stripMathDelimiters(seg.value);
      // Suggest using \frac if a/b pattern is detected, but do not auto-convert
      const shouldSuggestFrac =
        !latex.includes("\\frac") &&
        !latex.includes("\\over") &&
        /[a-zA-Z0-9]\s*\/\s*[a-zA-Z0-9]/.test(latex);
      latex = normalizeMathString(latex);
      const valid = isValidLatex(latex);
      // Compose tooltip for invalid LaTeX
      const tooltipContent = (
        <span>
          <b>Invalid LaTeX</b>
          <br />
          <span>
            Check for: balanced <code>{'{'}</code> <code>{'}'}</code>, <code>$...$</code>, <code>\\(...\\)</code>, <code>\\[...\\]</code>.<br />
          </span>
          <span style={{ color: "#888" }}>Tip: Try removing extra $ or braces.</span>
          {shouldSuggestFrac && (
            <>
              <br />
              <span style={{ color: "#888" }}>
                Tip: Did you mean <code>\\frac&#123;a&#125;&#123;b&#125;</code> instead of <code>a/b</code>?
              </span>
            </>
          )}
        </span>
      );
      // Inline math
      if (seg.type === "math") {
        if (valid) {
          return (
            <span className="inline-math" key={idx}>
              <InlineMath
                math={latex}
                aria-label={latex}
                style={inlineMathStyle}
              />
            </span>
          );
        } else {
          window.latexErrors.push({
            latex,
            context: input,
            tip: "Check for mismatched brackets or delimiters. Try using balanced { ... } or ensure $...$ are paired.",
          });
          return (
            <Tooltip key={idx} title={tooltipContent}>
              <span className="inline-math" style={{ color: "red" }}>
                {latex} <span style={{ fontSize: 12 }}>(Invalid LaTeX)</span>
              </span>
            </Tooltip>
          );
        }
      }
      // Block math
      if (seg.type === "block-math") {
        if (valid) {
          return (
            <div
              className="block-math"
              key={idx}
              style={{
                display: "block",
                textAlign: "center",
                margin: "0.7em 0",
                ...blockMathStyle,
              }}
            >
              <BlockMath
                math={latex}
                aria-label={latex}
                style={blockMathStyle}
              />
            </div>
          );
        } else {
          window.latexErrors.push({
            latex,
            context: input,
            tip: "Check for mismatched brackets or delimiters. Try using balanced { ... } or ensure $...$ are paired.",
          });
          return (
            <Tooltip key={idx} title={tooltipContent}>
              <div
                className="block-math"
                style={{
                  color: "red",
                  display: "block",
                  textAlign: "center",
                  margin: "0.7em 0",
                  ...blockMathStyle,
                }}
              >
                {latex} <span style={{ fontSize: 12 }}>(Invalid LaTeX)</span>
              </div>
            </Tooltip>
          );
        }
      }
    } else {
      // Plain text
      return <span key={idx}>{seg.value}</span>;
    }
  });
}

// Basic LaTeX validation (checks for mismatched brackets/delimiters)
function isValidLatex(str) {
  if (typeof str !== "string") return true;
  // Count brackets
  let stack = [];
  const pairs = { '{': '}', '[': ']' };
  for (let c of str) {
    if (c === '{' || c === '[') stack.push(c);
    if (c === '}' || c === ']') {
      if (!stack.length) return false;
      let last = stack.pop();
      if (pairs[last] !== c) return false;
    }
  }
  if (stack.length > 0) return false;
  // Check $...$ or \(..\) or \[..\] are matched
  let dollarCount = (str.match(/\$/g) || []).length;
  if (dollarCount % 2 !== 0) return false;
  let parenOpen = (str.match(/\\\(/g) || []).length;
  let parenClose = (str.match(/\\\)/g) || []).length;
  if (parenOpen !== parenClose) return false;
  let bracketOpen = (str.match(/\\\[/g) || []).length;
  let bracketClose = (str.match(/\\\]/g) || []).length;
  if (bracketOpen !== bracketClose) return false;
  return true;
}
import { Button, Typography, Modal, Input, message, Table } from "antd";
import { useDispatch, useSelector } from "react-redux";
import {
  addSection,
  addQuestion,
  removeQuestion,
  removeSection,
  updateQuestion,
  updateSection,
  moveQuestion,
  moveSection // added this
} from "../store/exam/examSlice";
import {
  selectExamData 
} from "../store/exam/selectors"
import 'quill/dist/quill.snow.css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

const { TextArea } = Input;


// Add global CSS for .inline-math (inline style block for now)
if (typeof window !== "undefined" && !window.__inlineMathStyle) {
  const style = document.createElement("style");
  style.innerHTML = `
    .inline-math {
      display: inline-block;
      vertical-align: middle;
      padding: 0 0.18em;
      line-height: 1.1;
    }
  `;
  document.head.appendChild(style);
  window.__inlineMathStyle = true;
}

const ExamDisplay = () => {
  const exam = useSelector(selectExamData);
  useEffect(() => {
    // Debugging purpose only
  }, [exam]);
  const [examItems, setExamItems] = useState([]);
  const dispatch = useDispatch();
  // Move useSensor hooks to top level of the component to ensure consistent hook order
  // Pagination page size state
  const [pageSize, setPageSize] = useState(10);
  const pointerSensor = useSensor(PointerSensor);
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);
  const [editModal, setEditModal] = useState({
    visible: false,
    type: "", // "section" | "question"
    item: null,
  });

  const [deleteModalState, setDeleteModalState] = useState({
    visible: false,
    examBodyIndex: null,
    questionsIndex: null,
    isSection: false,
  });

  //  move handler function
  const handleMove = (direction, examBodyIndex, questionsIndex = null) => {
    const newIndex = (questionsIndex !== null && questionsIndex !== undefined)
      ? questionsIndex + direction
      : examBodyIndex + direction;

    if (questionsIndex !== null && questionsIndex !== undefined) {
      // Moving a question inside a section
      dispatch(moveQuestion({
        source: { examBodyIndex, questionsIndex },
        destination: { examBodyIndex, questionsIndex: newIndex },
      }));
    } else {
      const examBody = exam.examBody;
      if (!examBody) return;

      const currentItem = examBody[examBodyIndex];
      const isSection = currentItem?.type === 'section';

      if (isSection) {
        dispatch(moveSection({ sourceIndex: examBodyIndex, destIndex: newIndex }));
      } else {
        dispatch(moveQuestion({
          source: { examBodyIndex },
          destination: { examBodyIndex: newIndex },
        }));
      }
    }
  };

  useEffect(() => {
    if (exam && !Array.isArray(exam?.examBody)) {
      console.warn(" examBody is not an array or missing:", exam?.examBody);
      return;
    }
    if (!exam) {
      // Do nothing if exam is simply not ready yet
      return;
    }
    
    const items = [];

    exam.examBody.forEach((entry) => {
      const type = (entry.type || "").toLowerCase();

      if (type === "section") {
        items.push({
          id: entry.id,
          type: "section",
          title: entry.title,
          subtext: entry.subtext,
        });

        (entry.questions || []).forEach((q) => {
          items.push({
            ...q,
            type: "question",
            section: entry.sectionTitle,
            questionText: q.questionText || q.contentText,
            options: (q.answers || []).map(a => String(a.contentText ?? "")),
            correctIndex: q.correctIndex ?? (q.answers || []).findIndex(a => a.correct),
          });
        });
        
      } else if (type === "question") {
        items.push({
          ...entry,
          type: "question",
          questionText: entry.questionText || entry.contentText,
          options: (entry.answers || []).map(a => String(a.contentText ?? "")),
          correctIndex: entry.correctIndex ?? (entry.answers || []).findIndex(a => a.correct),
        });
      
      } else {
        console.warn(" Unknown item type:", entry);
      }
    });

    setExamItems(items);
  }, [exam]);

  const handleEdit = (item) => {
    setEditModal({
      visible: true,
      type: item.type,
      item: { ...item }, // clone for editing
    });
  };

  const handleSaveEdit = () => {
    const { type, item } = editModal;
  
    let examBodyIndex = -1;
    let questionsIndex;
  
    if (type === "section") {
      examBodyIndex = exam.examBody.findIndex((entry) => entry.id === item.id);
      dispatch(updateSection({
        examBodyIndex,
        newData: {
          title: item.title,
          subtext: item.subtext,
        }
      }));
    } else if (type === "question") {
      for (let i = 0; i < exam.examBody.length; i++) {
        const section = exam.examBody[i];
        if (section.type === "section") {
          const qIndex = section.questions?.findIndex((q) => q.id === item.id);
          if (qIndex >= 0) {
            examBodyIndex = i;
            questionsIndex = qIndex;
            break;
          }
        } else if (section.id === item.id) {
          examBodyIndex = i;
          break;
        }
      }
  
      if (examBodyIndex === -1) {
        message.error("Failed to locate the question to update.");
        return;
      }
  
      dispatch(updateQuestion({
        location: {
          examBodyIndex,
          questionsIndex,
          questionId: item.id
        },
        newData: {
          questionText: item.questionText,
          options: item.options,
          correctIndex: item.correctIndex
        }
      }));
    }
  
    message.success("Saved changes");
    setEditModal({ visible: false, type: "", item: null });
  };
  
  const confirmDeleteItem = (examBodyIndex, questionsIndex = null) => {
    const entry = exam?.examBody?.[examBodyIndex];
    if (!entry) {
      console.warn("No entry found at examBodyIndex:", examBodyIndex);
      return;
    }
    setDeleteModalState({
      visible: true,
      examBodyIndex,
      questionsIndex,
      isSection: entry.type === "section",
    });
  };

  const executeDeleteItem = () => {
    const { examBodyIndex, questionsIndex, isSection } = deleteModalState;
    const entry = exam?.examBody?.[examBodyIndex];

    if (questionsIndex !== null && questionsIndex !== undefined) {
      dispatch(removeQuestion({ examBodyIndex, questionsIndex }));
    } else if (entry.type === "question") {
      dispatch(removeQuestion({ examBodyIndex }));
    } else if (entry.type === "section") {
      dispatch(removeSection(examBodyIndex));
    }

    setDeleteModalState({ visible: false, examBodyIndex: null, questionsIndex: null, isSection: false });
  };
  
  if (!exam || !Array.isArray(exam.examBody)) {
    return <div>Please open an exam or create a new file.</div>;
  }


  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3}>{exam.examTitle}</Typography.Title>
        {(exam.courseCode || exam.courseName || exam.semester || exam.year) && (
        <Typography.Text type="secondary">
          {[exam.courseCode, exam.courseName].filter(Boolean).join(" - ")}{" "}
          {exam.semester} {exam.year}
        </Typography.Text>
      )}

      </div>
  
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        dropAnimation={{ duration: 250, easing: 'ease' }}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        // The following handlers are now no-ops, since activeItemId state has been removed
        onDragStart={() => {}}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
  
          const updated = arrayMove(
            examItems,
            examItems.findIndex(i => i.id === active.id),
            examItems.findIndex(i => i.id === over.id)
          );
          setExamItems(updated);
          message.success("Reordered");
        }}
      >
        {examItems.length === 0 && (
          <div style={{ marginTop: 24, color: 'red' }}>
            ⚠️ Exam loaded but contains no sections or questions to display.
          </div>
        )}
        <Table
          columns={[
            {
              title: "ID",
              dataIndex: "id",
              key: "id",
              render: (id) => id?.split('-').pop(),
            },
            {
              title: "Type",
              dataIndex: "type",
              key: "type",
            },
            {
              title: "Section",
              dataIndex: "section",
              key: "section",
            },
            {
              title: "Title / Question",
              dataIndex: "titleOrQuestion",
              key: "titleOrQuestion",
              render: (text, record) => {
                if (record.type === "section") {
                  // Use renderTextWithMath for mixed math/text in section title
                  const titleStr = record.title?.split('-').slice(2).join('-').trim() || record.title || "";
                  return (
                    <div>
                      <strong>
                        {renderTextWithMath(titleStr)}
                      </strong>
                      {record.subtext && (
                        <div style={{ fontStyle: "italic", color: "#888" }}>
                          {renderTextWithMath(record.subtext)}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Question: use renderTextWithMath for questionText
                  return renderTextWithMath(record.questionText);
                }
              }
            },
            {
              title: "Options",
              dataIndex: "options",
              key: "options",
              render: (opts, record) =>
                record.type === "question" && Array.isArray(opts)
                  ? opts.map((o, i) => {
                      // Guard: Only render if o is a string
                      if (typeof o !== "string") {
                        console.warn("Option is not a string for KaTeX:", o);
                        return (
                          <div key={i}>
                            {String.fromCharCode(97 + i)}){" "}
                            <span style={{ color: "red" }}>[Invalid Option: not a string]</span>
                          </div>
                        );
                      }
                      try {
                        return (
                          <div key={i}>
                            {String.fromCharCode(97 + i)}){" "}
                            {renderTextWithMath(o)}
                          </div>
                        );
                      } catch {
                        return (
                          <div key={i}>
                            {String.fromCharCode(97 + i)}){" "}
                            <span style={{ color: 'red' }}>{o} (Render error)</span>
                          </div>
                        );
                      }
                    })
                  : null,
            },
            {
              title: "Correct Answer",
              dataIndex: "correctIndex",
              key: "correctIndex",
              render: (index, record) => {
                if (record.type === "question" && Array.isArray(record.options)) {
                  const ans = record.options[index];
                  if (typeof ans !== "string") {
                    console.warn("Correct answer is not a string for KaTeX:", ans);
                    return <span style={{ color: 'red' }}>[Invalid Correct Answer: not a string]</span>;
                  }
                  try {
                    return <>{renderTextWithMath(ans)}</>;
                  } catch {
                    return <span style={{ color: 'red' }}>{ans} (Render error)</span>;
                  }
                }
                return null;
              }
            },
            {
              title: "Marks",
              dataIndex: "marks",
              key: "marks",
              render: (_, record) =>
                record.type === "question"
                  ? record.marks ?? 1
                  : null,
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <>
                  <Button size="small" onClick={() => handleEdit(record)} style={{ marginRight: 8 }}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      handleMove(-1, record.examBodyIndex, record.questionsIndex)
                    }
                    disabled={record.questionsIndex !== undefined
                      ? record.questionsIndex === 0
                      : record.examBodyIndex === 0}
                    style={{ marginRight: 4 }}
                  >
                    ↑
                  </Button>
                  <Button
                    size="small"
                    onClick={() =>
                      handleMove(1, record.examBodyIndex, record.questionsIndex)
                    }
                    disabled={
                      record.questionsIndex !== undefined
                        ? record.questionsIndex === exam.examBody[record.examBodyIndex]?.questions.length - 1
                        : record.examBodyIndex === exam.examBody.length - 1
                    }
                    style={{ marginRight: 8 }}
                  >
                    ↓
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      record.type === "question"
                        ? confirmDeleteItem(record.examBodyIndex, record.questionsIndex)
                        : confirmDeleteItem(record.examBodyIndex)
                    }
                  >
                    Delete
                  </Button>
                </>
              ),
            },
          ]}
          dataSource={(examItems || []).map((item, index) => {
            const examBodyIndex = exam.examBody.findIndex(entry => {
              if (item.type === "section") return entry.id === item.id;
              if (item.type === "question") {
                if (entry.type === "section") {
                  return entry.questions?.some(q => q.id === item.id);
                } else {
                  return entry.id === item.id;
                }
              }
              return false;
            });

            const questionsIndex =
              item.type === "question" && exam.examBody[examBodyIndex]?.type === "section"
                ? exam.examBody[examBodyIndex].questions.findIndex(q => q.id === item.id)
                : undefined;

            return {
              key: `${item.type}-${item.id}-${index}`,
              ...item,
              titleOrQuestion: item.type === "section" ? item.title : item.questionText,
              examBodyIndex,
              questionsIndex,
              marks: item.marks,
            };
          })}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => setPageSize(pageSize),
          }}
          scroll={{ x: "max-content" }}
        />
      </DndContext>
  
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <Button type="dashed" onClick={() => {
          const questionData = {
            questionText: "New Question",
            options: ["Option A", "Option B", "Option C", "Option D", "Option E"],
            correctIndex: 0,
            lockedPositionsMap: [-1, -1, -1, -1, -1],
            answerShuffleMap: [],
          };
          dispatch(addQuestion({ questionData }));
          message.success("Question added");
        }}>Add Question</Button>
        <Button type="dashed" onClick={() => {
          dispatch(addSection({ title: "Untitled Section", subtext: "Instructions..." }));
          message.success("Section added");
        }}>Add Section</Button>
        <Button
          type="primary"
          style={{ backgroundColor: '#722ed1' }}
          onClick={async () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".docx";
            input.onchange = async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              try {
                const module = await import('../services/examImportService');
                const examDTO = await module.default.processDocxExam(file);

                let index = 0;
                for (const item of examDTO.examBody || []) {
                  if (item.type === "section") {
                    const { questions, ...sectionWithoutQuestions } = item;
                    dispatch(addSection(sectionWithoutQuestions));
                    for (const question of questions || []) {
                      dispatch(addQuestion({ examBodyIndex: index, questionData: question }));
                    }
                  } else {
                    dispatch(addQuestion({ examBodyIndex: null, questionData: item }));
                  }
                  index++;
                }

                message.success("Questions imported from DOCX");
              } catch (error) {
                console.error("DOCX import failed:", error);
                message.error("Failed to import DOCX");
              }
            };
            input.click();
          }}
        >
          Add Questions from DOCX
        </Button>
        <Button
          type="primary"
          style={{ backgroundColor: '#389e0d' }}
          onClick={async () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".xml";
            input.onchange = async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              try {
                const module = await import('../services/examImportService');
                const examDTO = await module.default.processMoodleExam(file);

                let index = 0;
                for (const item of examDTO.examBody || []) {
                  if (item.type === "section") {
                    const { questions, ...sectionWithoutQuestions } = item;
                    dispatch(addSection(sectionWithoutQuestions));
                    for (const question of questions || []) {
                      dispatch(addQuestion({ examBodyIndex: index, questionData: question }));
                    }
                  } else {
                    dispatch(addQuestion({ examBodyIndex: null, questionData: item }));
                  }
                  index++;
                }

                message.success("Questions imported from XML");
              } catch (error) {
                console.error("XML import failed:", error);
                message.error("Failed to import XML");
              }
            };
            input.click();
          }}
        >
          Add Questions from XML
        </Button>
        <Button
          type="primary"
          style={{ backgroundColor: '#13c2c2' }}
          onClick={async () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".tex";
            input.onchange = async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              try {
                const module = await import('../services/examImportService');
                const examDTO = await module.default.processLatexExam(file);

                let index = 0;
                for (const item of examDTO.examBody || []) {
                  if (item.type === "section") {
                    const { questions, ...sectionWithoutQuestions } = item;
                    dispatch(addSection(sectionWithoutQuestions));
                    for (const question of questions || []) {
                      dispatch(addQuestion({ examBodyIndex: index, questionData: question }));
                    }
                  } else {
                    dispatch(addQuestion({ examBodyIndex: null, questionData: item }));
                  }
                  index++;
                }

                message.success("Questions imported from LaTeX");
              } catch (error) {
                console.error("LaTeX import failed:", error);
                message.error("Failed to import LaTeX");
              }
            };
            input.click();
          }}
        >
          Add Questions from LaTeX
        </Button>
      </div>
  
      <Modal
        open={editModal.visible}
        title={`Edit ${editModal.type}`}
        onCancel={() => setEditModal({ visible: false, type: "", item: null })}
        onOk={handleSaveEdit}
      >
        {editModal.type === "section" && (
          <>
            <Input
              value={editModal.item?.title}
              onChange={(e) => setEditModal((prev) => ({
                ...prev,
                item: { ...prev.item, title: e.target.value }
              }))}
              placeholder="Section Title"
              style={{ marginBottom: 8 }}
            />
            <TextArea
              value={editModal.item?.subtext}
              onChange={(e) => setEditModal((prev) => ({
                ...prev,
                item: { ...prev.item, subtext: e.target.value }
              }))}
              placeholder="Instructions or Subtext"
              autoSize
            />
          </>
        )}
  
        {editModal.type === "question" && (
          <>
            <Input
              value={editModal.item?.questionText}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  item: { ...prev.item, questionText: e.target.value },
                }))
              }
              placeholder="Question Text"
              style={{ marginBottom: 8 }}
            />
            {editModal.item?.options?.map((opt, idx) => (
              <Input
                key={idx}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...editModal.item.options];
                  newOpts[idx] = e.target.value;
                  setEditModal((prev) => ({
                    ...prev,
                    item: { ...prev.item, options: newOpts },
                  }));
                }}
                placeholder={`Option ${String.fromCharCode(97 + idx)}`}
                style={{ marginBottom: 6 }}
              />
            ))}
            <Input
              type="number"
              min={0}
              max={editModal.item?.options?.length - 1}
              value={editModal.item?.correctIndex}
              onChange={(e) =>
                setEditModal((prev) => ({
                  ...prev,
                  item: { ...prev.item, correctIndex: parseInt(e.target.value, 10) },
                }))
              }
              placeholder="Correct Answer Index"
            />
          </>
        )}
      </Modal>

      <Modal
        open={deleteModalState.visible}
        title={deleteModalState.isSection ? "Delete Section and All Its Questions?" : "Delete Question?"}
        onOk={executeDeleteItem}
        onCancel={() => setDeleteModalState({ visible: false, examBodyIndex: null, questionsIndex: null, isSection: false })}
        okText="Yes, delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          {deleteModalState.isSection
            ? "This will permanently remove the section and all its contained questions. This cannot be undone."
            : "This will permanently remove the question. This cannot be undone."}
        </p>
      </Modal>
    </div>
  );
};

export default ExamDisplay;
