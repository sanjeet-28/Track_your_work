import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Download, Sun, Moon, Monitor, Sliders, AlertCircle, RefreshCw } from 'lucide-react';
import { settingsApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { Button } from '../components/common/Button';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { showToast } = useTasks();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await settingsApi.getSettings();
      if (res.data && res.data.theme && res.data.theme !== theme) {
        setTheme(res.data.theme);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Failed to load settings from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleDownload = (format) => {
    if (format === 'json') setDownloadingJson(true);
    else setDownloadingCsv(true);

    const link = document.createElement('a');
    link.href = `/api/export?format=${format}`;
    link.download = `worktracker-export.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingJson(false);
      setDownloadingCsv(false);
      showToast(`Exported ${format.toUpperCase()} successfully`);
    }, 500);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-500" />
            <span>Application Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Loading your preferences...
          </p>
        </div>
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Fetching settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-500" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure appearance, working hours, notifications, and export productivity data
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="xs" onClick={fetchSettings}>
            Retry
          </Button>
        </div>
      )}

      {/* Appearance Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Appearance & Theme
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Color Theme Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={async () => {
                setTheme('light');
                try {
                  await settingsApi.updateSettings({ theme: 'light' });
                  showToast('Theme set to Light mode');
                } catch (e) {
                  console.error(e);
                }
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setTheme('dark');
                try {
                  await settingsApi.updateSettings({ theme: 'dark' });
                  showToast('Theme set to Dark mode');
                } catch (e) {
                  console.error(e);
                }
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setTheme('system');
                try {
                  await settingsApi.updateSettings({ theme: 'system' });
                  showToast('Theme set to System Auto mode');
                } catch (e) {
                  console.error(e);
                }
              }}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
                theme === 'system' || theme === 'auto'
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Monitor className="w-5 h-5 text-slate-400" />
              <span>System Auto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Export Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Download className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Data Export & Backup
          </h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export your complete database of tasks, actual work sessions, categories, and reflections.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => handleDownload('json')}
            loading={downloadingJson}
          >
            Export JSON Archive
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => handleDownload('csv')}
            loading={downloadingCsv}
          >
            Export CSV Spreadsheet
          </Button>
        </div>
      </div>
    </div>
  );
}
