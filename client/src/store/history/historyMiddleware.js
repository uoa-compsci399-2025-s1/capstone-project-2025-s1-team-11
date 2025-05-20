import { pushState } from './historySlice';
import { initialiseExamState } from '../exam/examSlice';

// List of actions that should be tracked in history
const TRACKED_ACTIONS = [
  'exam/addSection',
  'exam/addQuestion',
  'exam/updateQuestion',
  'exam/updateSection',
  'exam/moveQuestion',
  'exam/moveSection',
  'exam/removeQuestion',
  'exam/removeSection',
  'exam/updateExamField',
  'exam/updateExamMetadata',
  'exam/setExamVersions',
  'exam/setTeleformOptions'
];

export const historyMiddleware = store => next => action => {
  // First, let the action go through
  const result = next(action);

  // Handle undo/redo actions
  if (action.type === 'history/undo' || action.type === 'history/redo') {
    const historyState = store.getState().history;
    if (historyState.present) {
      //console.log('History middleware: Restoring exam state from history');
      // Update the exam state with the restored state
      store.dispatch(initialiseExamState(historyState.present.examData));
    }
  }
  // If this is a tracked action, update history
  else if (TRACKED_ACTIONS.includes(action.type)) {
    //console.log('History middleware: Tracking action:', action.type);
    // Get the current exam state
    const currentState = store.getState().exam;
    
    // Only track if we have exam data
    if (currentState.examData) {
      //console.log('History middleware: Pushing state to history');
      // Push a deep copy of the current state to history
      store.dispatch(pushState(JSON.parse(JSON.stringify(currentState))));
    } else {
      //console.log('History middleware: No exam data to track');
    }
  }

  return result;
}; 