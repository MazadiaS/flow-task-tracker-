import { useState } from 'react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onComplete: () => void;
}

function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Flow! 🎯',
      description: 'Your ADHD-friendly task tracker designed to help you stay focused and organized.',
      image: '🚀',
      points: [
        'Track tasks with timers, counters, and completion states',
        'Plan goals with mind maps and flowcharts',
        'Visualize your day with timeline views',
        'Student mode for homework and coursework',
      ]
    },
    {
      title: 'Track Your Day 📊',
      description: 'Start each day and log all your activities in one place.',
      image: '⏰',
      points: [
        'Click "START DAY" to begin tracking',
        'Work on tasks and log your progress',
        'View efficiency metrics and active time',
        'End your day to see comprehensive stats',
      ]
    },
    {
      title: 'Organize with Goals 🗺️',
      description: 'Create goal hierarchies and link tasks to track progress.',
      image: '🎯',
      points: [
        'Build goal plans with parent-child relationships',
        'Visualize with mind maps and flowcharts',
        'Link tasks to goals for alignment tracking',
        'Use AI-assisted interview for goal creation',
      ]
    },
    {
      title: 'Keyboard Shortcuts ⌨️',
      description: 'Work faster with keyboard shortcuts.',
      image: '⚡',
      points: [
        `${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + N: Add new task`,
        `${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + E: Export data`,
        '1-5: Switch between views',
        '?: Show all shortcuts',
      ]
    },
    {
      title: 'You are All Set! 🎉',
      description: 'Start your productivity journey with Flow.',
      image: '✨',
      points: [
        'All data is saved locally in your browser',
        'Optional Gist sync for backup',
        'PWA support - install as an app',
        'Press ? anytime to view shortcuts',
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem('flow-onboarding-completed', 'true');
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('flow-onboarding-completed', 'true');
    onComplete();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="welcome-overlay">
      <div className="welcome-container">
        <div className="welcome-header">
          <div className="welcome-progress">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
          {currentStep > 0 && (
            <button className="welcome-skip" onClick={handleSkip}>
              Skip Tutorial
            </button>
          )}
        </div>

        <div className="welcome-content">
          <div className="welcome-icon">{currentStepData.image}</div>
          <h1>{currentStepData.title}</h1>
          <p className="welcome-description">{currentStepData.description}</p>

          <ul className="welcome-points">
            {currentStepData.points.map((point, index) => (
              <li key={index}>
                <span className="point-bullet">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="welcome-footer">
          <button
            className="btn-welcome btn-secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            ← Previous
          </button>

          <div className="step-indicator">
            {currentStep + 1} / {steps.length}
          </div>

          <button className="btn-welcome btn-primary" onClick={handleNext}>
            {isLastStep ? "Let's Go! 🚀" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
