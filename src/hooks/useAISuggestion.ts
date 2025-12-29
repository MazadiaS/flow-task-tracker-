/**
 * Custom hook for AI task name suggestions
 * Eliminates duplicate logic between AddTaskModal and EditTaskModal
 */

import { useState } from 'react';
import { getSuggestedTaskName } from '../utils/aiHelpers';

export const useAISuggestion = (initialTaskName: string = '') => {
  const [taskName, setTaskName] = useState(initialTaskName);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const handleGetSuggestion = async () => {
    if (!taskName.trim() || taskName.trim().length < 3) {
      return;
    }

    setIsLoadingSuggestion(true);
    setAiSuggestion(null);

    try {
      const suggestion = await getSuggestedTaskName(taskName);
      if (suggestion && suggestion !== taskName) {
        setAiSuggestion(suggestion);
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleApplySuggestion = () => {
    if (aiSuggestion) {
      setTaskName(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleDismissSuggestion = () => {
    setAiSuggestion(null);
  };

  return {
    taskName,
    setTaskName,
    aiSuggestion,
    isLoadingSuggestion,
    handleGetSuggestion,
    handleApplySuggestion,
    handleDismissSuggestion
  };
};
