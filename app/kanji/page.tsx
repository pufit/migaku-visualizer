import { getWordList } from '@/lib/data';
import { getWaniKaniData } from '@/lib/wanikani';
import { KanjiFilter } from '@/components/KanjiFilter';

type WordStatus = "KNOWN" | "LEARNING" | "UNKNOWN" | "IGNORED";

function isKanji(char: string) {
    return /[\u4e00-\u9faf]/.test(char);
}

export default async function KanjiPage() {
    const data = await getWordList();

    if (!data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-24">
                <h1 className="text-4xl font-bold mb-4">Kanji Statistics</h1>
                <p className="text-xl">No data synced yet.</p>
            </div>
        );
    }

    // Load WaniKani data
    const waniKaniData = getWaniKaniData();

    // Group kanji by word status
    const kanjiByStatus: Record<WordStatus, Map<string, string[]>> = {
        KNOWN: new Map(),
        LEARNING: new Map(),
        UNKNOWN: new Map(),
        IGNORED: new Map()
    };

    // Process all words and group by status
    data.words.forEach(word => {
        const status = word.knownStatus as WordStatus;
        if (!kanjiByStatus[status]) return;

        const chars = word.dictForm.split('');
        chars.forEach(char => {
            if (isKanji(char)) {
                const map = kanjiByStatus[status];
                if (!map.has(char)) {
                    map.set(char, []);
                }
                if (!map.get(char)!.includes(word.dictForm)) {
                    map.get(char)!.push(word.dictForm);
                }
            }
        });
    });

    // Convert maps to sorted arrays with WaniKani info
    const kanjiData: Record<WordStatus, Array<{ kanji: string; words: string[]; waniKaniInfo?: any }>> = {
        KNOWN: [],
        LEARNING: [],
        UNKNOWN: [],
        IGNORED: []
    };

    (Object.keys(kanjiByStatus) as WordStatus[]).forEach(status => {
        kanjiData[status] = Array.from(kanjiByStatus[status].entries())
            .map(([kanji, words]) => ({
                kanji,
                words,
                waniKaniInfo: waniKaniData.get(kanji)
            }))
            .sort((a, b) => b.words.length - a.words.length);
    });

    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8">Kanji Statistics</h1>

            <KanjiFilter kanjiByStatus={kanjiData} />
        </main>
    );
}
