import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Tooltip, Row, Col } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { selectExamData } from '../../store/exam/selectors';
import { handleExamDetailsSave } from '../../services/examEditService';
import ExamSidebar from './ExamSidebar';
import EditExamModal from './EditExamModal';

const ExamSidebarProvider = ({ children }) => {
  const dispatch = useDispatch();
  const exam = useSelector(selectExamData);
  
  // state management for the sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editDetailsData, setEditDetailsData] = useState({
    examTitle: '',
    courseCode: '',
    courseName: '',
    semester: '',
    year: ''
  });

  React.useEffect(() => {
    if (exam) {
      setEditDetailsData({
        examTitle: exam.examTitle || '',
        courseCode: exam.courseCode || '',
        courseName: exam.courseName || '',
        semester: exam.semester || '',
        year: exam.year || ''
      });
    }
  }, [exam]);

  const handleNavigateToItem = useCallback((itemId) => {
    setCurrentItemId(itemId);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleEditDetailsSave = useCallback(() => {
    handleExamDetailsSave(editDetailsData, dispatch, () => setShowEditDetailsModal(false));
  }, [editDetailsData, dispatch]);

  const handleEditDetails = useCallback(() => {
    setShowEditDetailsModal(true);
  }, []);

  const showSidebar = !!exam;

  return (
    <>
      {showSidebar && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
          paddingRight: sidebarCollapsed ? 0 : 24
        }}>
          <Tooltip title={sidebarCollapsed ? "Show Exam Sidebar" : "Hide Exam Sidebar"}>
            <Button
              type="default"
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
            >
              {sidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
            </Button>
          </Tooltip>
        </div>
      )}

      <Row gutter={24}>
        <Col 
          xs={24} 
          xl={sidebarCollapsed || !showSidebar ? 24 : 18} 
          style={{ transition: 'width 0.3s' }}
        >
          {children}
        </Col>
        
        {showSidebar && !sidebarCollapsed && (
          <Col xs={6} style={{ transition: 'width 0.3s' }}>
            <ExamSidebar
              exam={exam}
              currentItemId={currentItemId}
              onNavigateToItem={handleNavigateToItem}
              onEditDetails={handleEditDetails}
            />
          </Col>
        )}
      </Row>

      {showSidebar && (
        <EditExamModal
          open={showEditDetailsModal}
          onCancel={() => setShowEditDetailsModal(false)}
          onOk={handleEditDetailsSave}
          editDetailsData={editDetailsData}
          setEditDetailsData={setEditDetailsData}
        />
      )}
    </>
  );
};

export default ExamSidebarProvider; 