"use client"

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface DictionaryBlockProps {
    word: string;
}

interface JishoData {
    slug: string;
    is_common: boolean;
    japanese: {
        word?: string;
        reading?: string;
    }[];
    senses: {
        english_definitions: string[];
        parts_of_speech: string[];
    }[];
}

export function DictionaryBlock({ word }: DictionaryBlockProps) {
    const [data, setData] = useState<JishoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/dictionary?term=${encodeURIComponent(word)}`);
                if (!response.ok) throw new Error('Failed to fetch data');

                const result = await response.json();
                if (result.data && result.data.length > 0) {
                    setData(result.data[0]); // Use the first result
                } else {
                    setError('Definition not found');
                }
            } catch (err) {
                setError('Error loading definition');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [word]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-lg text-2xl font-bold">
                    📖
                </div>
                <div>
                    <div className="text-sm text-gray-500 uppercase tracking-wider font-bold">Dictionary</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                        Jisho.org
                    </div>
                </div>
            </div>

            <div className="min-h-[100px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-24 gap-3 text-gray-400">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                        <span className="text-sm font-medium">Looking up "{word}"...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-24 gap-2 text-gray-500">
                        <span className="text-2xl">🤔</span>
                        <span className="font-medium">{error}</span>
                    </div>
                ) : data ? (
                    <div className="space-y-4">
                        {/* Word & Reading */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {data.japanese[0].word || word}
                            </span>
                            <span className="text-xl text-gray-500 dark:text-gray-400 font-medium">
                                {data.japanese[0].reading}
                            </span>
                            {data.is_common && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    Common
                                </span>
                            )}
                        </div>

                        {/* Meanings */}
                        <div className="space-y-3">
                            {data.senses.slice(0, 3).map((sense, idx) => (
                                <div key={idx} className="text-sm">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                        {sense.parts_of_speech.map((pos, i) => (
                                            <span key={i} className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                                                {pos}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="text-gray-700 dark:text-gray-200 leading-relaxed">
                                        {sense.english_definitions.join('; ')}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-right">
                            <a
                                href={`https://jisho.org/search/${encodeURIComponent(word)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-500 hover:text-blue-600 hover:underline"
                            >
                                View on Jisho.org →
                            </a>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
