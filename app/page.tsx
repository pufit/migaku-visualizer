import { getWordList } from '@/lib/data';
import { WordStatusChart } from '@/components/WordStatusChart';
import { LearningTimeline } from '@/components/LearningTimeline';
import { MonthlyProgressChart } from '@/components/MonthlyProgressChart';
import { ActivityHeatmap } from '@/components/ActivityHeatmap';

export default async function Home() {
  const data = await getWordList();

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold mb-4">Migaku Visualizer</h1>
        <p className="text-xl">No data synced yet.</p>
        <p className="mt-2 text-gray-500">Please use the "Sync to Visualizer" button in Migaku.</p>
      </div>
    );
  }

  const totalWords = data.words.length;
  const knownWords = data.words.filter(w => w.knownStatus === "KNOWN").length;
  const learningWords = data.words.filter(w => w.knownStatus === "LEARNING").length;
  const unknownWords = data.words.filter(w => w.knownStatus === "UNKNOWN").length;
  const ignoredWords = data.words.filter(w => w.knownStatus === "IGNORED").length;

  const chartData = [
    { name: 'Known', value: knownWords },
    { name: 'Learning', value: learningWords },
    { name: 'Unknown', value: unknownWords },
    { name: 'Ignored', value: ignoredWords },
  ];

  // Process timeline data (cumulative known words over time)
  const knownWordsWithTime = data.words
    .filter(w => w.knownStatus === "KNOWN" && w.mod)
    .map(w => ({ date: new Date(w.mod), word: w.dictForm }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by date and get cumulative count
  const dateCountMap = new Map<string, number>();
  knownWordsWithTime.forEach((item) => {
    const dateStr = item.date.toISOString().split('T')[0];
    dateCountMap.set(dateStr, (dateCountMap.get(dateStr) || 0) + 1);
  });

  // Create cumulative timeline
  const timelineData: { date: number; count: number }[] = [];
  let cumulativeCount = 0;
  Array.from(dateCountMap.keys())
    .sort()
    .forEach(dateStr => {
      cumulativeCount += dateCountMap.get(dateStr) || 0;
      timelineData.push({ date: new Date(dateStr).getTime(), count: cumulativeCount });
    });

  // Sample timeline data to avoid too many points (take every Nth point)
  const sampledTimeline = timelineData.filter((_, i) =>
    i === 0 || i === timelineData.length - 1 || i % Math.max(1, Math.floor(timelineData.length / 50)) === 0
  );

  // Process monthly data (new known words per month)
  const monthlyMap = new Map<string, number>();
  knownWordsWithTime.forEach(item => {
    const month = item.date.toISOString().substring(0, 7); // YYYY-MM
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
  });

  const monthlyData = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Process daily heatmap data - show full year
  const dailyMap = new Map<string, number>();
  knownWordsWithTime.forEach(item => {
    const date = item.date.toISOString().split('T')[0];
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
  });

  // Generate full year of dates
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const allDatesInYear: { date: string; count: number }[] = [];
  const current = new Date(oneYearAgo);
  while (current <= today) {
    const dateStr = current.toISOString().split('T')[0];
    allDatesInYear.push({ date: dateStr, count: dailyMap.get(dateStr) || 0 });
    current.setDate(current.getDate() + 1);
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <h1 className="text-4xl font-bold mb-8">Learning Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-12">
        <StatCard title="Total Words" value={totalWords} />
        <StatCard title="Known Words" value={knownWords} color="text-green-600" />
        <StatCard title="Learning Words" value={learningWords} color="text-yellow-600" />
      </div>

      <div className="w-full max-w-6xl space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Word Status Distribution</h2>
          <div className="h-80">
            <WordStatusChart data={chartData} />
          </div>
        </div>

        {allDatesInYear.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Activity Heatmap</h2>
            <ActivityHeatmap data={allDatesInYear} />
          </div>
        )}

        {sampledTimeline.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Learning Timeline</h2>
            <div className="h-80">
              <LearningTimeline data={sampledTimeline} />
            </div>
          </div>
        )}

        {monthlyData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Monthly Progress</h2>
            <div className="h-80">
              <MonthlyProgressChart data={monthlyData} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ title, value, color = "text-gray-900 dark:text-gray-100" }: { title: string, value: number, color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col items-center">
      <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className={`text-4xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
