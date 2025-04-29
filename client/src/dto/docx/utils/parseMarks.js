export const parseMarks = (text) => {
  const match = text.match(/\[(\d+(?:\.\d+)?) mark(?:s)?\]/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
};