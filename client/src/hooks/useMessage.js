import { message } from 'antd';
import { App } from 'antd';

// Create a custom hook that provides theme-aware message functions
const useMessage = () => {
  const staticMessage = App.useApp();

  return {
    success: (content, duration) => staticMessage.message.success(content, duration),
    error: (content, duration) => staticMessage.message.error(content, duration),
    info: (content, duration) => staticMessage.message.info(content, duration),
    warning: (content, duration) => staticMessage.message.warning(content, duration),
  };
};

export default useMessage; 