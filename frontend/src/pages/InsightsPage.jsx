import { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { InsightsList } from '../components/analytics/InsightsList';
import { Button } from '../components/common/Button';

export function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getInsights();
      if (res.data) setInsights(res.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span>Productivity Insights</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated intelligence calculated directly from your actual logged database history
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={fetchInsights}
          loading={loading}
        >
          Refresh Insights
        </Button>
      </div>

      <InsightsList insights={insights} />
    </div>
  );
}
