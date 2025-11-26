"use client"

import { useState } from 'react';
import type { WaniKaniKanji } from '@/lib/wanikani';

type WordStatus = "KNOWN" | "LEARNING" | "UNKNOWN" | "IGNORED";

interface KanjiData {
    kanji: string;
    words: string[];
    waniKaniInfo?: WaniKaniKanji;
}

interface KanjiFilterProps {
    kanjiByStatus: Record<WordStatus, KanjiData[]>;
}

export function KanjiFilter({ kanjiByStatus }: KanjiFilterProps) {
    const [selectedStatus, setSelectedStatus] = useState<WordStatus>("KNOWN");
    const [expandedReadings, setExpandedReadings] = useState<Set<string>>(new Set());
    const [expandedMnemonics, setExpandedMnemonics] = useState<Set<string>>(new Set());

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

    const toggleReadings = (kanji: string) => {
        const newExpanded = new Set(expandedReadings);
        if (newExpanded.has(kanji)) {
            newExpanded.delete(kanji);
        } else {
            newExpanded.add(kanji);
        }
        setExpandedReadings(newExpanded);
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

    const getLevelColor = (level: number) => {
        if (level <= 10) return "bg-green-500";
        if (level <= 20) return "bg-blue-500";
        if (level <= 30) return "bg-yellow-500";
        if (level <= 40) return "bg-orange-500";
        if (level <= 50) return "bg-red-500";
        return "bg-purple-500";
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
            {/* Filter buttons */}
            <div className="mb-6 flex flex-wrap gap-2">
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

            {/* Kanji list */}
            <div className="space-y-2">
                {currentKanji.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        No kanji found for {statusLabels[selectedStatus]} words
                    </div>
                ) : (
                    currentKanji.map(({ kanji, words, waniKaniInfo }) => {
                        const isReadingsExpanded = expandedReadings.has(kanji);
                        const isMnemonicsExpanded = expandedMnemonics.has(kanji);

                        // Group readings by type
                        const readingsByType = waniKaniInfo?.readings.reduce((acc, r) => {
                            if (!acc[r.type]) acc[r.type] = [];
                            acc[r.type].push(r.reading);
                            return acc;
                        }, {} as Record<string, string[]>) || {};

                        return (
                            <div key={kanji} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                                <div className="p-4 flex items-start gap-6">
                                    {/* Left Column: Kanji & Readings */}
                                    <div className="flex-shrink-0 w-32 flex flex-col items-center gap-4">
                                        <div className="w-24 h-24 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-xl relative shadow-sm">
                                            <span className="text-5xl font-bold">{kanji}</span>
                                            {waniKaniInfo && (
                                                <div className={`absolute -top-2 -right-2 ${getLevelColor(waniKaniInfo.level)} text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm`}>
                                                    Lv.{waniKaniInfo.level}
                                                </div>
                                            )}
                                        </div>

                                        {waniKaniInfo && (
                                            <div
                                                className="w-full relative group cursor-pointer"
                                                onClick={() => toggleReadings(kanji)}
                                            >
                                                <div className={`flex flex-col gap-2 transition-all duration-300 ${isReadingsExpanded ? '' : 'blur-sm opacity-60 group-hover:blur-[2px] group-hover:opacity-80'}`}>
                                                    {Object.entries(readingsByType).map(([type, readings]) => (
                                                        <div key={type} className="text-center bg-gray-50 dark:bg-gray-700/50 rounded p-1.5">
                                                            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{type}</div>
                                                            <div className="text-sm font-medium">{readings.join(', ')}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {!isReadingsExpanded && (
                                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm backdrop-blur-sm transform group-hover:scale-105 transition-transform">
                                                            Reveal
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Words & Mnemonics */}
                                    <div className="flex-1 min-w-0 pt-2">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {words.length} word{words.length !== 1 ? 's' : ''}
                                            </div>
                                            {waniKaniInfo && (
                                                <button
                                                    onClick={() => toggleMnemonics(kanji)}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                                >
                                                    {isMnemonicsExpanded ? 'Hide Mnemonics' : 'Show Mnemonics'}
                                                </button>
                                            )}
                                        </div>

                                        {waniKaniInfo && isMnemonicsExpanded && (
                                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Meaning Mnemonic</h4>
                                                    <div
                                                        className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                                                        dangerouslySetInnerHTML={{ __html: formatMnemonic(waniKaniInfo.meaning_mnemonic) }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Reading Mnemonic</h4>
                                                    <div
                                                        className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                                                        dangerouslySetInnerHTML={{ __html: formatMnemonic(waniKaniInfo.reading_mnemonic) }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {words.map((word, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-block px-3 py-1.5 text-base bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
        </div>
    );
}
