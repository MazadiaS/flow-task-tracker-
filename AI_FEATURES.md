# AI-Powered Features

This app includes AI-powered features to help you manage tasks and plan long-term goals.

## Features

### 1. **Spell Checking**
- All text inputs (task names and notes) have built-in browser spell checking enabled
- Red underlines will appear under misspelled words
- Right-click on misspelled words to see suggestions

### 2. **AI Task Name Suggestions**
The "✨ AI Help" button provides intelligent suggestions for task names by:
- Fixing spelling and grammar errors
- Shortening long task names (max 30 characters recommended)
- Clarifying ambiguous wording
- Maintaining the original task's intent

### 3. **AI Goal Planning**
The "✨ AI-Assisted Plan" feature creates hierarchical goal plans:
- 6-question interview about your goals and constraints
- Generates Year → Quarter → Month → Week hierarchy
- Fully editable AI-generated goals
- Progress tracking and visualization

## Setup

### Prerequisites
You need an OpenAI API key to use the AI features:

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key

### Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your API key to `.env`:
   ```
   VITE_OPENAI_API_KEY=sk-...
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

## Usage

### In Add/Edit Task Modal:

1. Type your task name (at least 3 characters)
2. Click the **"✨ AI Help"** button
3. Wait for the AI suggestion (usually 1-2 seconds)
4. Review the suggestion in the highlighted box
5. Click **"Apply"** to use the suggestion, or **"✕"** to dismiss it

### Example Transformations:

| Original Input | AI Suggestion |
|----------------|---------------|
| "I need to practise typing for like 30 mins or something" | "Typing Practice (30 min)" |
| "studing algoritms and datbase stuff" | "Study Algorithms & Databases" |
| "do some pushups maybe 50" | "50 Push-ups" |
| "learing react and typescript" | "Learn React & TypeScript" |

## Privacy & Cost

- **Privacy**: Task names and goal interview responses are sent to OpenAI's API for processing
- **Models**:
  - Task suggestions: GPT-4o-mini (fast and cost-effective)
  - Goal planning: GPT-4o (best reasoning for complex planning)
- **Cost**:
  - Task suggestions: ~$0.0001 per suggestion (very low cost)
  - Goal plan generation: ~$0.01-0.02 per complete plan
- **Data**: Only task names and goal interview responses are sent; no other app data is shared

## Disabling AI Features

If you don't want to use AI features:
1. Simply don't add the API key to your `.env` file
2. The AI buttons will still appear but won't function
3. Spell checking will continue to work (it's browser-based)
4. You can still create goals manually

## Troubleshooting

**AI Help button doesn't work:**
- Check that your `.env` file exists and has a valid API key
- Ensure the server was restarted after adding the API key
- Check browser console for error messages

**Suggestions are slow:**
- First request may be slower (API cold start)
- Subsequent requests should be faster
- Typical response time: 1-2 seconds for suggestions, 30-60 seconds for goal plans

**API key errors:**
- Verify your API key is valid at platform.openai.com
- Check that you have credits available in your OpenAI account
- Ensure the key hasn't expired
