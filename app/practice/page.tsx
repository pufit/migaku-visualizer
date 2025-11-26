import { getWordList } from '@/lib/data';
import { getWaniKaniData } from '@/lib/wanikani';
import { PracticeGame } from '@/components/PracticeGame';

export default async function PracticePage() {
    const data = await getWordList();
    const waniKaniData = getWaniKaniData();

    if (!data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-24">
                <h1 className="text-4xl font-bold mb-4">Practice Mode</h1>
                <p className="text-xl">No data synced yet.</p>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <PracticeGame words={data.words} waniKaniData={waniKaniData} />
        </main>
    );
}
