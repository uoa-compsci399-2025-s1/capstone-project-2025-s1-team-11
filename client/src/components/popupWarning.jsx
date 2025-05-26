// Popup warning component, chromium browsers only!ye

import React from 'react';
import { Modal, Button, Typography } from 'antd';
const { Paragraph } = Typography;

const PopupWarning = ({ visible, onClose }) => {
  return (
    <Modal
      title="Browser Compatibility Popup Warning"
      open={ visible }
      onCancel={ onClose }
      footer={[
        <Button key="submit" type="primary" onClick ={ onClose }>
          Understood
        </Button>,
      ]}
      centered
    >
      <Paragraph>
        This web application only works properly in Chromium-based browsers, such as Chrome and Edge.
      </Paragraph>
    </Modal>
  );
};

export default PopupWarning;
