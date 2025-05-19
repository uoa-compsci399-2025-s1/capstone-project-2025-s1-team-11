import {Button, Col, Divider, Empty, Progress, Radio, Row, Statistic, Typography} from "antd";
import {generateResultOutput} from "../../utilities/marker/outputFormatter.js";
import React from "react";

export const results = ({setExportFormat,exportFormat,resultsData,handleExportResults,examData}) => {
  return (
    <>
      <Typography.Title level={3}>Results & Analytics</Typography.Title>
      <p>
        This is the results dashboard. It summarises overall performance statistics and provides detailed insights regarding student responses,
        question-level performance and analysis. You can also export your results for further review.
      </p>

      {/* Export format selection */}
      <Radio.Group
        onChange={(e) => setExportFormat(e.target.value)}
        value={exportFormat}
        style={{ marginBottom: 16 }}
      >
        <Radio value="json">JSON Format</Radio>
        <Radio value="text">Text Format (Legacy Style)</Radio>
      </Radio.Group>

      {/* Result's display */}
      {resultsData && resultsData.length > 0 ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={handleExportResults}>
              Export Results
            </Button>
          </div>

          {resultsData && resultsData.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Typography.Title level={4}>Statistics Summary</Typography.Title>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Total Students" value={resultsData.length} />
                </Col>
                <Col span={6}>
                  <Statistic title="Max Score" value={Math.max(...resultsData.map(r => r.totalMarks || 0))} />
                </Col>
                <Col span={6}>
                  <Statistic title="Min Score" value={Math.min(...resultsData.map(r => r.totalMarks || 0))} />
                </Col>
                <Col span={6}>
                  <Statistic title="Average Score" value={
                    (resultsData.reduce((acc, r) => acc + (r.totalMarks || 0), 0) / resultsData.length).toFixed(2)
                  } />
                </Col>
              </Row>
              {/* Additional Insights and Distribution */}
              <div style={{ marginTop: 32, marginBottom: 0 }}>
                <div style={{ marginBottom: 24 }}>
                  <Typography.Title level={5}>Additional Insights</Typography.Title>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="Pass Rate (%)"
                        value={
                          (
                            (resultsData.filter(r => (r.totalMarks / r.maxMarks) >= 0.5).length / resultsData.length) * 100
                          ).toFixed(1)
                        }
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Score Range"
                        value={
                          `${Math.min(...resultsData.map(r => r.totalMarks || 0))} - ${Math.max(...resultsData.map(r => r.totalMarks || 0))}`
                        }
                      />
                    </Col>
                  </Row>

                  <Divider />

                  <Typography.Title level={5}>Score Distribution</Typography.Title>
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const lower = idx * 20;
                    const upper = lower + 20;
                    const count = resultsData.filter(r => {
                      const percent = (r.totalMarks / r.maxMarks) * 100;
                      return percent >= lower && percent < upper;
                    }).length;

                    return (
                      <div key={idx} style={{ marginBottom: 8 }}>
                        <Typography.Text>{`${lower}% - ${upper}%:`}</Typography.Text>
                        <Progress
                          percent={count / resultsData.length * 100}
                          showInfo={true}
                          format={percent => `${count} students`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="results-preview" style={{ backgroundColor: "#f5f5f5", padding: 16, maxHeight: 400, overflow: "auto" }}>
            <h4>Preview: {resultsData.length} students</h4>
            {resultsData.map((result, index) => (
              <div key={index} className="student-result" style={{ marginBottom: 12, padding: 8, border: "1px solid #ddd", borderRadius: 4 }}>
                <h5>{result.lastName || "Unknown"}, {result.firstName || "Unknown"} ({result.studentId || "N/A"})</h5>
                <p>Version: {result.versionNumber || "N/A"}</p>
                <p>Score: {result.totalMarks !== undefined ? result.totalMarks : "?"}/{result.maxMarks !== undefined ? result.maxMarks : "?"}</p>
                <details>
                  <summary>View Details</summary>
                  <pre>{generateResultOutput(result, examData)}</pre>
                </details>
              </div>
            ))}
          </div>
        </>
      ) : (
        <Empty description="No results available. Mark exams to see results here."/>
      )}
    </>
  );
};