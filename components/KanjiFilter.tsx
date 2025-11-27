"use client"

import { useState } from 'react';
import type { WaniKaniKanji } from '@/lib/wanikani';
import type { JlptKanji } from '@/lib/jlpt';
import { DictionaryPopup } from './DictionaryPopup';

type WordStatus = "KNOWN" | "LEARNING" | "UNKNOWN" | "IGNORED";

interface KanjiData {
    kanji: string;
    words: string[];
    waniKaniInfo?: WaniKaniKanji;
    jlptInfo?: JlptKanji;
}

interface KanjiFilterProps {
    kanjiByStatus: Record<WordStatus, KanjiData[]>;
}

export function KanjiFilter({ kanjiByStatus }: KanjiFilterProps) {
    const [selectedStatus, setSelectedStatus] = useState<WordStatus>("KNOWN");
    const [expandedReadings, setExpandedReadings] = useState<Set<string>>(new Set());
    const [expandedMeanings, setExpandedMeanings] = useState<Set<string>>(new Set());
    const [expandedMnemonics, setExpandedMnemonics] = useState<Set<string>>(new Set());
    const [isAllRevealed, setIsAllRevealed] = useState(false);

    type SortOption = 'OCCURRENCE' | 'WK_LEVEL' | 'JLPT_LEVEL';
    type SortDirection = 'ASC' | 'DESC';
    const [sortBy, setSortBy] = useState<SortOption>('OCCURRENCE');
    const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    const statusLabels: Record<WordStatus, string> = {
        KNOWN: "Known",
        LEARNING: "Learning",
        UNKNOWN: "Unknown",
        IGNORED: "Ignored"
    };

    const statusColors: Record<WordStatus, string> = {
        KNOWN: "bg-blue-600 hover:bg-blue-700",
        LEARNING: "bg-green-600 hover:bg-green-700",
        UNKNOWN: "bg-yellow-600 hover:bg-yellow-700",
        IGNORED: "bg-gray-600 hover:bg-gray-700"
    };

    const currentKanji = kanjiByStatus[selectedStatus] || [];

    // Sorting Logic
    const sortedKanji = [...currentKanji].sort((a, b) => {
        let diff = 0;
        switch (sortBy) {
            case 'OCCURRENCE':
                diff = a.words.length - b.words.length;
                break;
            case 'WK_LEVEL':
                diff = (a.waniKaniInfo?.level ?? 100) - (b.waniKaniInfo?.level ?? 100);
                break;
            case 'JLPT_LEVEL':
                const jlptMap: Record<string, number> = { 'N5': 1, 'N4': 2, 'N3': 3, 'N2': 4, 'N1': 5 };
                const levelA = jlptMap[a.jlptInfo?.jlpt || ''] ?? 100;
                const levelB = jlptMap[b.jlptInfo?.jlpt || ''] ?? 100;
                diff = levelA - levelB;
                break;
        }
        return sortDirection === 'ASC' ? diff : -diff;
    });

    const toggleSortDirection = () => {
        setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    };

    const toggleReadings = (kanji: string) => {
        const newExpanded = new Set(expandedReadings);
        if (newExpanded.has(kanji)) {
            newExpanded.delete(kanji);
        } else {
            newExpanded.add(kanji);
        }
        setExpandedReadings(newExpanded);
    };

    const toggleMeanings = (kanji: string) => {
        const newExpanded = new Set(expandedMeanings);
        if (newExpanded.has(kanji)) {
            newExpanded.delete(kanji);
        } else {
            newExpanded.add(kanji);
        }
        setExpandedMeanings(newExpanded);
    };

    const toggleMnemonics = (kanji: string) => {
        const newExpanded = new Set(expandedMnemonics);
        if (newExpanded.has(kanji)) {
            newExpanded.delete(kanji);
        } else {
            newExpanded.add(kanji);
        }
        setExpandedMnemonics(newExpanded);
    };

    const toggleAll = () => {
        if (isAllRevealed) {
            setExpandedReadings(new Set());
            setExpandedMeanings(new Set());
            setIsAllRevealed(false);
        } else {
            const allKanji = currentKanji.map(k => k.kanji);
            setExpandedReadings(new Set(allKanji));
            setExpandedMeanings(new Set(allKanji));
            setIsAllRevealed(true);
        }
    };

    const getLevelColor = (level: number) => {
        if (level <= 10) return "bg-green-500";
        if (level <= 20) return "bg-blue-500";
        if (level <= 30) return "bg-yellow-500";
        if (level <= 40) return "bg-orange-500";
        if (level <= 50) return "bg-red-500";
        return "bg-purple-500";
    };

    const getJlptColor = (level: string) => {
        switch (level) {
            case 'N5': return "bg-green-600";
            case 'N4': return "bg-teal-600";
            case 'N3': return "bg-blue-600";
            case 'N2': return "bg-purple-600";
            case 'N1': return "bg-red-600";
            default: return "bg-gray-500";
        }
    };

    const formatMnemonic = (text: string) => {
        return text
            .replace(/<kanji>(.*?)<\/kanji>/g, '<span class="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-1 rounded font-medium">$1</span>')
            .replace(/<radical>(.*?)<\/radical>/g, '<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded font-medium">$1</span>')
            .replace(/<vocabulary>(.*?)<\/vocabulary>/g, '<span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1 rounded font-medium">$1</span>')
            .replace(/<reading>(.*?)<\/reading>/g, '<span class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded font-medium">$1</span>');
    };

    return (
        <div className="w-full max-w-6xl">
            {/* Controls Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(statusLabels) as WordStatus[]).map((status) => {
                        const count = kanjiByStatus[status]?.length || 0;
                        const isSelected = selectedStatus === status;

                        return (
                            <button
                                key={status}
                                onClick={() => setSelectedStatus(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isSelected
                                    ? statusColors[status] + " text-white"
                                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {statusLabels[status]} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Right Side Controls */}
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Sort Dropdown & Direction */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Sort by:</span>
                        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="bg-transparent text-gray-700 dark:text-gray-200 text-sm focus:ring-0 border-none py-2 pl-3 pr-8"
                            >
                                <option value="OCCURRENCE">Occurrence</option>
                                <option value="WK_LEVEL">WK Level</option>
                                <option value="JLPT_LEVEL">JLPT Level</option>
                            </select>
                            <button
                                onClick={toggleSortDirection}
                                className="px-2 py-2 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                title={sortDirection === 'ASC' ? "Ascending" : "Descending"}
                            >
                                {sortDirection === 'ASC' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={toggleAll}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                        {isAllRevealed ? "Hide All Spoilers" : "Reveal All Spoilers"}
                    </button>
                </div>
            </div>

            {/* Kanji list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedKanji.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                        No kanji found for {statusLabels[selectedStatus]} words
                    </div>
                ) : (
                    sortedKanji.map(({ kanji, words, waniKaniInfo, jlptInfo }) => {
                        const isReadingsExpanded = expandedReadings.has(kanji);
                        const isMeaningsExpanded = expandedMeanings.has(kanji);
                        const isMnemonicsExpanded = expandedMnemonics.has(kanji);

                        // Group readings by type (excluding nanori)
                        const readingsByType = waniKaniInfo?.readings
                            .filter(r => r.type !== 'nanori')
                            .reduce((acc, r) => {
                                if (!acc[r.type]) acc[r.type] = [];
                                acc[r.type].push(r.reading);
                                return acc;
                            }, {} as Record<string, string[]>) || {};

                        return (
                            <div key={kanji} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col">
                                {/* Card Header: Kanji & Meta */}
                                <div className="p-4 flex gap-4 items-start border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm text-3xl font-bold text-gray-800 dark:text-gray-100">
                                        {kanji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {waniKaniInfo && (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white ${getLevelColor(waniKaniInfo.level)}`}>
                                                    WK {waniKaniInfo.level}
                                                </span>
                                            )}
                                            {jlptInfo?.jlpt && (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white ${getJlptColor(jlptInfo.jlpt)}`}>
                                                    {jlptInfo.jlpt}
                                                </span>
                                            )}
                                            {jlptInfo?.frequency && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide text-white bg-gray-400 dark:bg-gray-600">
                                                    #{jlptInfo.frequency}
                                                </span>
                                            )}
                                        </div>
                                        {waniKaniInfo && (
                                            <div
                                                className="text-sm font-medium cursor-pointer transition-all duration-300"
                                                onClick={() => toggleMeanings(kanji)}
                                            >
                                                {isMeaningsExpanded ? (
                                                    <span className="text-gray-600 dark:text-gray-300">{waniKaniInfo.meanings.join(', ')}</span>
                                                ) : (
                                                    <span className="bg-gray-200 dark:bg-gray-700 text-transparent rounded px-1 select-none">Spoiler</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Body: Readings & Words */}
                                <div className="p-4 flex-1 flex flex-col gap-4">
                                    {/* Readings Section */}
                                    {waniKaniInfo && (
                                        <div
                                            className="relative group cursor-pointer rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-900"
                                            onClick={() => toggleReadings(kanji)}
                                        >
                                            <div className={`grid grid-cols-2 gap-2 transition-all duration-300 ${isReadingsExpanded ? '' : 'blur-sm opacity-50'}`}>
                                                {Object.entries(readingsByType).map(([type, readings]) => (
                                                    <div key={type} className="flex flex-col">
                                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">{type}</span>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{readings.join(', ')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {!isReadingsExpanded && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/80 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                                        Reveal Readings
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Words Section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                                                {words.length} Word{words.length !== 1 ? 's' : ''}
                                            </span>
                                            {waniKaniInfo && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleMnemonics(kanji); }}
                                                    className="text-[10px] font-bold uppercase text-blue-500 hover:text-blue-600 transition-colors"
                                                >
                                                    {isMnemonicsExpanded ? 'Hide Info' : 'Show Info'}
                                                </button>
                                            )}
                                        </div>

                                        {waniKaniInfo && isMnemonicsExpanded && (
                                            <div className="mb-3 text-sm space-y-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase text-blue-400 block mb-1">Meaning</span>
                                                    <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMnemonic(waniKaniInfo.meaning_mnemonic) }} />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase text-blue-400 block mb-1">Reading</span>
                                                    <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMnemonic(waniKaniInfo.reading_mnemonic) }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-1.5">
                                            {words.map((word, idx) => (
                                                <span
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedWord(word); }}
                                                    className="inline-flex px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                                                >
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Dictionary Popup */}
            {selectedWord && (
                <DictionaryPopup
                    word={selectedWord}
                    onClose={() => setSelectedWord(null)}
                />
            )}
        </div>
    );
}
