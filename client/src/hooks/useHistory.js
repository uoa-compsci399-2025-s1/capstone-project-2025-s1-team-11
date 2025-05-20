import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { undo, redo, selectCanUndo, selectCanRedo } from '../store/history/historySlice';

export const useHistory = () => {
  const dispatch = useDispatch();
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);

  const handleUndo = useCallback(() => {
    console.log('useHistory: Undo called, canUndo:', canUndo);
    if (canUndo) {
      dispatch(undo());
    }
  }, [dispatch, canUndo]);

  const handleRedo = useCallback(() => {
    console.log('useHistory: Redo called, canRedo:', canRedo);
    if (canRedo) {
      dispatch(redo());
    }
  }, [dispatch, canRedo]);

  return {
    canUndo,
    canRedo,
    undo: handleUndo,
    redo: handleRedo,
  };
}; 