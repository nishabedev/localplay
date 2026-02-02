import React from 'react';
import type { UserPreferences } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences | null;
  onUpdatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreference,
}) => {
  if (!isOpen || !preferences) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-800 z-50 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-6">
          {/* Playback Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
              Playback
            </h3>
            <div className="space-y-4">
              {/* Default Playback Rate */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Default Speed</div>
                  <div className="text-sm text-gray-400">
                    Playback speed for new videos
                  </div>
                </div>
                <select
                  value={preferences.defaultPlaybackRate}
                  onChange={(e) => onUpdatePreference('defaultPlaybackRate', parseFloat(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={1.75}>1.75x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              {/* Subtitles Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Subtitles</div>
                  <div className="text-sm text-gray-400">
                    Show subtitles when available
                  </div>
                </div>
                <button
                  onClick={() => onUpdatePreference('subtitlesEnabled', !preferences.subtitlesEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.subtitlesEnabled !== false ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.subtitlesEnabled !== false ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Display Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
              Display
            </h3>
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Light Theme</div>
                  <div className="text-sm text-gray-400">
                    Switch between dark and light mode
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newTheme = (preferences.theme || 'dark') === 'dark' ? 'light' : 'dark';
                    // Apply theme immediately to DOM
                    if (newTheme === 'light') {
                      document.documentElement.classList.add('light-theme');
                      document.documentElement.classList.remove('dark-theme');
                      document.body.classList.add('light-theme');
                      document.body.classList.remove('dark-theme');
                    } else {
                      document.documentElement.classList.add('dark-theme');
                      document.documentElement.classList.remove('light-theme');
                      document.body.classList.add('dark-theme');
                      document.body.classList.remove('light-theme');
                    }
                    onUpdatePreference('theme', newTheme);
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.theme === 'light' ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.theme === 'light' ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Replace Underscore Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Replace _ with space</div>
                  <div className="text-sm text-gray-400">
                    Display underscores as spaces in names
                  </div>
                </div>
                <button
                  onClick={() => onUpdatePreference('replaceUnderscoreWithColon', !preferences.replaceUnderscoreWithColon)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.replaceUnderscoreWithColon ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.replaceUnderscoreWithColon ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sidebar Width */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">Sidebar Width</div>
                    <div className="text-sm text-gray-400">
                      Default width of video sidebar
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{preferences.sidebarWidth}px</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="500"
                  value={preferences.sidebarWidth}
                  onChange={(e) => onUpdatePreference('sidebarWidth', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Audio Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
              Audio
            </h3>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium">Default Volume</div>
                  <div className="text-sm text-gray-400">
                    Starting volume for videos
                  </div>
                </div>
                <span className="text-sm text-gray-400">{Math.round(preferences.defaultVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={preferences.defaultVolume}
                onChange={(e) => onUpdatePreference('defaultVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
