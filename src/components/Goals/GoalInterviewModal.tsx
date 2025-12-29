import { useState } from 'react';
import type { InterviewResponse } from '../../types/goals';
import './GoalInterviewModal.css';

interface Props {
  onComplete: (responses: InterviewResponse[]) => void;
  onCancel: () => void;
}

interface Question {
  id: string;
  text: string;
  placeholder: string;
  type: 'text' | 'textarea';
}

const QUESTIONS: Question[] = [
  {
    id: 'main-goal',
    text: 'What is your primary goal for the next year?',
    placeholder: 'e.g., Become a senior software engineer, Launch my business, Master a new skill',
    type: 'textarea'
  },
  {
    id: 'skills',
    text: 'What specific skills or knowledge do you want to acquire?',
    placeholder: 'e.g., System design, React, PostgreSQL, Public speaking',
    type: 'textarea'
  },
  {
    id: 'time-commitment',
    text: 'How much time can you dedicate daily or weekly?',
    placeholder: 'e.g., 2 hours daily, 15 hours weekly, weekends only',
    type: 'text'
  },
  {
    id: 'constraints',
    text: 'What are your main constraints or challenges?',
    placeholder: 'e.g., Full-time job, family commitments, limited budget',
    type: 'textarea'
  },
  {
    id: 'milestones',
    text: 'Any specific milestones or deadlines?',
    placeholder: 'e.g., Interview in 6 months, project launch in Q3, certification by year-end',
    type: 'textarea'
  },
  {
    id: 'preferences',
    text: 'What are your learning preferences?',
    placeholder: 'e.g., Project-based, reading-heavy, video courses, hands-on practice',
    type: 'text'
  }
];

function GoalInterviewModal({ onComplete, onCancel }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showReview, setShowReview] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer before continuing');
      return;
    }

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: currentAnswer
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer(newAnswers[QUESTIONS[currentQuestionIndex + 1].id] || '');
    } else {
      setShowReview(true);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(answers[QUESTIONS[currentQuestionIndex - 1].id] || '');
    }
  };

  const handleEditQuestion = (index: number) => {
    setShowReview(false);
    setCurrentQuestionIndex(index);
    setCurrentAnswer(answers[QUESTIONS[index].id] || '');
  };

  const handleSubmit = () => {
    const responses: InterviewResponse[] = QUESTIONS.map(q => ({
      questionId: q.id,
      question: q.text,
      answer: answers[q.id] || '',
      timestamp: Date.now()
    }));

    onComplete(responses);
  };

  if (showReview) {
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content interview-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Review Your Answers</h2>
            <button className="btn-close" onClick={onCancel}>
              ✕
            </button>
          </div>

          <div className="interview-review">
            <p className="review-intro">
              Review your answers below. Click on any answer to edit it.
            </p>

            <div className="review-list">
              {QUESTIONS.map((q, index) => (
                <div key={q.id} className="review-item">
                  <div className="review-question">
                    <span className="review-number">{index + 1}.</span>
                    {q.text}
                  </div>
                  <div className="review-answer">
                    {answers[q.id]}
                  </div>
                  <button
                    className="btn-edit-answer"
                    onClick={() => handleEditQuestion(index)}
                  >
                    ✏️ Edit
                  </button>
                </div>
              ))}
            </div>

            <div className="interview-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowReview(false)}
              >
                ← Back to Questions
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                ✨ Generate My Goal Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content interview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AI Goal Planning Interview</h2>
          <button className="btn-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="interview-content">
          <div className="interview-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">
              Question {currentQuestionIndex + 1} of {QUESTIONS.length}
            </span>
          </div>

          <div className="interview-question">
            <h3>{currentQuestion.text}</h3>

            {currentQuestion.type === 'textarea' ? (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                rows={6}
                autoFocus
              />
            ) : (
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder={currentQuestion.placeholder}
                autoFocus
              />
            )}
          </div>

          <div className="interview-actions">
            {currentQuestionIndex > 0 ? (
              <button className="btn btn-secondary" onClick={handleBack}>
                ← Previous
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}

            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!currentAnswer.trim()}
            >
              {currentQuestionIndex < QUESTIONS.length - 1 ? 'Next →' : 'Review Answers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalInterviewModal;
