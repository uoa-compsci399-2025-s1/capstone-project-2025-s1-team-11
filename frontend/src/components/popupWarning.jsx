// Popup warning component, chromium browsers only!ye

import React from 'react';
import { Modal, Button } from 'antd';

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
      <p>This web application only works properly in Chromium-based browsers, such as Chrome and Edge.</p>
    </Modal>
  );
};

export default PopupWarning;
