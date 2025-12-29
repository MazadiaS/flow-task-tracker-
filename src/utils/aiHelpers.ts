// Simple spell checker using browser's built-in API
export const checkSpelling = (text: string): boolean => {
  // This is a placeholder - in a real implementation you'd use a spell check library
  // For now, we'll use basic validation
  if (!text || text.trim().length === 0) return true;

  // Check for common issues
  const hasRepeatedChars = /(.)\1{3,}/.test(text);
  const hasOnlyNumbers = /^\d+$/.test(text);

  return !hasRepeatedChars && !hasOnlyNumbers;
};

// AI task name suggestions using OpenAI API
// Gracefully handles offline mode - returns null if network is unavailable
export const getSuggestedTaskName = async (taskName: string): Promise<string | null> => {
  if (!taskName || taskName.trim().length === 0) return null;

  // Check if we're online (works in both browser and Electron)
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('Offline mode: AI suggestions disabled');
    return null;
  }

  // ⚠️ SECURITY WARNING: API keys should NEVER be in client-side code!
  // This exposes your key in the browser. See SECURITY.md for proper solutions.
  // TODO: Move this to a backend proxy server or serverless function
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  if (!apiKey) {
    // API key not configured - this is actually safer than having it in client code
    return null;
  }

  try {
    // Add timeout to prevent long waits when network is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 0.3,
        messages: [{
          role: 'system',
          content: 'You are a helpful assistant that improves task names. Return ONLY the improved task name, nothing else.'
        }, {
          role: 'user',
          content: `Given this task name: "${taskName}"

Please provide a shorter, clearer version (maximum 30 characters) that:
- Fixes any spelling errors
- Uses clear, concise language
- Keeps the original meaning
- Is suitable for a task tracker

Return ONLY the suggested name, nothing else. If the original is already good, return it as-is.`
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('AI suggestion failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    const suggestion = data.choices[0]?.message?.content?.trim();

    // Only return if suggestion is different and reasonable
    if (suggestion && suggestion.length > 0 && suggestion.length <= 50) {
      return suggestion;
    }

    return null;
  } catch (error) {
    // Network errors, timeouts, or aborts are silently ignored
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('AI suggestion timeout');
      } else if (error.message.includes('fetch')) {
        console.log('Network unavailable: AI suggestions disabled');
      } else {
        console.log('Error getting AI suggestion:', error.message);
      }
    }
    return null;
  }
};

// Local spell check for common words (fallback)
export const getSpellingSuggestions = (text: string): string[] => {
  const words = text.toLowerCase().split(/\s+/);
  const suggestions: string[] = [];

  // Common task-related word corrections
  const corrections: Record<string, string> = {
    'excercise': 'exercise',
    'writting': 'writing',
    'programing': 'programming',
    'studing': 'studying',
    'practise': 'practice',
    'learing': 'learning',
    'datbase': 'database',
    'algoritm': 'algorithm',
    'meditate': 'meditate',
    'pushups': 'push-ups',
  };

  words.forEach(word => {
    if (corrections[word]) {
      suggestions.push(corrections[word]);
    }
  });

  return suggestions;
};
