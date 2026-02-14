import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-gray-800 light-card border border-gray-700 light-border rounded-lg shadow-xl p-4 flex items-center gap-3">
        <div className="flex-1 text-sm text-gray-100 light-text-strong">
          New version available!
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
}
