"use client"

import { useState, useEffect } from 'react';
import { X, Volume2, Loader2 } from 'lucide-react';

interface DictionaryPopupProps {
    word: string;
    onClose: () => void;
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

export function DictionaryPopup({ word, onClose }: DictionaryPopupProps) {
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

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Dictionary</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                            <span className="text-sm font-medium">Looking up "{word}"...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-500">
                            <span className="text-4xl">🤔</span>
                            <span className="font-medium">{error}</span>
                        </div>
                    ) : data ? (
                        <div className="space-y-4">
                            {/* Word & Reading */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">
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
        </div>
    );
}
