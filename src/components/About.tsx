import React from 'react';

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

const About: React.FC<AboutProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* About Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-gray-800 z-50 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About LocalPlay</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 text-gray-700 dark:text-gray-300">

          {/* What is LocalPlay */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              What is LocalPlay?
            </h3>
            <p className="text-sm">
              LocalPlay is a lightweight video player for your local video collections. Point it at a folder on your computer and it organizes your videos into courses and lessons with progress tracking, subtitles, and a clean playback experience — all without uploading anything.
            </p>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Features
            </h3>
            <ul className="text-sm space-y-2 ml-4 list-disc">
              <li>Browse videos organized by course and lesson</li>
              <li>Automatic progress tracking and resume</li>
              <li>SRT subtitle support</li>
              <li>Auto-play next video</li>
              <li>Keyboard shortcuts for playback control</li>
              <li>Works fully offline as a PWA</li>
              <li>Light and dark theme</li>
            </ul>
          </section>

          {/* Privacy */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Privacy
            </h3>
            <p className="text-sm">
              All data stays on your device. No files are uploaded to any server. Your progress and preferences are stored locally in your browser.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Contact
            </h3>
            <p className="text-sm mb-3">
              Have feedback, suggestions, or found a bug?
            </p>
            <a
              href="mailto:nishabedev@gmail.com?subject=LocalPlay%20Feedback"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Send Feedback
            </a>
          </section>

        </div>
      </div>
    </>
  );
};

export default About;
