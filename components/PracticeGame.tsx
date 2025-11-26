"use client"

import { useState, useEffect, useRef } from 'react';
import type { Word } from '@/lib/data';
import type { WaniKaniKanji } from '@/lib/wanikani';

type GameState = 'setup' | 'playing' | 'results';
type GameMode = 'standard' | 'fast-typing';
type KanjiSetting = 'with-kanji' | 'without-kanji' | 'mixed';
type Duration = 60 | 120 | 300;
type Category = "KNOWN" | "LEARNING" | "UNKNOWN";

interface PracticeGameProps {
    words: Word[];
    waniKaniData: Map<string, WaniKaniKanji>;
}

export function PracticeGame({ words, waniKaniData }: PracticeGameProps) {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [gameMode, setGameMode] = useState<GameMode>('standard');
    const [kanjiSetting, setKanjiSetting] = useState<KanjiSetting>('with-kanji');
    const [duration, setDuration] = useState<Duration>(60);
    const [category, setCategory] = useState<Category>("KNOWN");
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentWord, setCurrentWord] = useState<Word | null>(null);
    const [displayKanji, setDisplayKanji] = useState(true);
    const [userInput, setUserInput] = useState("");
    const [score, setScore] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [mistakenWords, setMistakenWords] = useState<Set<Word>>(new Set());
    const [gameWords, setGameWords] = useState<Word[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Helper to determine if we should show kanji for the next word
    const shouldShowKanji = () => {
        if (kanjiSetting === 'with-kanji') return true;
        if (kanjiSetting === 'without-kanji') return false;
        return Math.random() > 0.5;
    };

    // Setup game
    const startGame = () => {
        const filteredWords = words.filter(w => w.knownStatus === category);
        if (filteredWords.length === 0) {
            alert(`No words found for category: ${category}`);
            return;
        }

        // Shuffle words
        const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
        setGameWords(shuffled);
        setCurrentWord(shuffled[0]);
        setDisplayKanji(shouldShowKanji());
        setTimeLeft(duration);
        setScore(0);
        setMistakes(0);
        setMistakenWords(new Set());
        setUserInput("");
        setShowAnswer(false);
        setGameState('playing');
    };

    // Timer logic
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setGameState('results');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Focus input on new word or game start
    useEffect(() => {
        if (gameState === 'playing' && !showAnswer) {
            inputRef.current?.focus();
        }
    }, [gameState, currentWord, showAnswer]);

    // Handle input submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWord) return;

        if (showAnswer) {
            // Move to next word
            nextWord();
            return;
        }

        // Check answer (simple comparison for now, maybe fuzzy later?)
        // Remove whitespace and convert to lowercase just in case
        const cleanInput = userInput.trim();
        const cleanAnswer = currentWord.secondary.trim();
        const cleanDictForm = currentWord.dictForm.trim();

        if (cleanInput === cleanAnswer || cleanInput === cleanDictForm) {
            setScore(s => s + 1);
            nextWord();
        } else {
            setMistakes(m => m + 1);
            setShowAnswer(true);
            setMistakenWords(prev => {
                const newSet = new Set(prev);
                newSet.add(currentWord);
                return newSet;
            });
        }
    };

    const nextWord = () => {
        const currentIndex = gameWords.indexOf(currentWord!);
        const nextIndex = (currentIndex + 1) % gameWords.length;
        setCurrentWord(gameWords[nextIndex]);
        setDisplayKanji(shouldShowKanji());
        setUserInput("");
        setShowAnswer(false);
    };

    // Helper to get kanji info for current word
    const getKanjiInfo = (word: Word) => {
        const kanjiChars = word.dictForm.split('').filter(c => /[\u4e00-\u9faf]/.test(c));
        return kanjiChars.map(char => ({
            char,
            info: waniKaniData.get(char)
        })).filter((k): k is { char: string; info: WaniKaniKanji } => k.info !== undefined);
    };

    const formatMnemonic = (text: string) => {
        return text
            .replace(/<kanji>(.*?)<\/kanji>/g, '<span class="bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 px-1 rounded font-medium">$1</span>')
            .replace(/<radical>(.*?)<\/radical>/g, '<span class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded font-medium">$1</span>')
            .replace(/<vocabulary>(.*?)<\/vocabulary>/g, '<span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1 rounded font-medium">$1</span>')
            .replace(/<reading>(.*?)<\/reading>/g, '<span class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 rounded font-medium">$1</span>');
    };

    if (gameState === 'setup') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 w-full max-w-md mx-auto p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Practice Mode</h2>
                    <p className="text-gray-500">Test your reading speed and accuracy</p>
                </div>

                <div className="w-full space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['standard', 'fast-typing'] as GameMode[]).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setGameMode(m)}
                                    className={`p-3 rounded-lg border transition-all capitalize ${gameMode === m
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }`}
                                >
                                    {m.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Kanji Display</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['with-kanji', 'without-kanji', 'mixed'] as KanjiSetting[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setKanjiSetting(s)}
                                    className={`p-3 rounded-lg border transition-all capitalize text-sm ${kanjiSetting === s
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }`}
                                >
                                    {s.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Duration</label>
                        <div className="grid grid-cols-3 gap-2">
                            {([60, 120, 300] as Duration[]).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`p-3 rounded-lg border transition-all ${duration === d
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }`}
                                >
                                    {d}s
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["KNOWN", "LEARNING", "UNKNOWN"] as Category[]).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCategory(c)}
                                    className={`p-3 rounded-lg border transition-all text-sm font-medium ${category === c
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={startGame}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95"
                >
                    Start Practice
                </button>
            </div>
        );
    }

    if (gameState === 'results') {
        const wpm = Math.round((score / duration) * 60);
        const accuracy = Math.round((score / (score + mistakes)) * 100) || 0;

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 w-full max-w-4xl mx-auto p-4">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
                    <p className="text-gray-500">Here's how you did</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-1">{wpm}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">WPM</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center">
                        <div className="text-4xl font-bold text-green-600 mb-1">{accuracy}%</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Accuracy</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">{score}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Correct</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm text-center">
                        <div className="text-4xl font-bold text-red-500 mb-1">{mistakes}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Mistakes</div>
                    </div>
                </div>

                {mistakenWords.size > 0 && (
                    <div className="w-full mt-8">
                        <h3 className="text-xl font-bold mb-6 text-center">Review Failed Words</h3>
                        <div className="space-y-6">
                            {Array.from(mistakenWords).map((word, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                        <span className="text-3xl font-bold">{word.dictForm}</span>
                                        <span className="text-xl text-red-500 font-medium">{word.secondary}</span>
                                    </div>

                                    <div className="space-y-6">
                                        {getKanjiInfo(word).map(({ char, info }) => (
                                            <div key={char} className="grid md:grid-cols-12 gap-6">
                                                <div className="md:col-span-1 flex justify-center md:justify-start">
                                                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg text-2xl font-bold">
                                                        {char}
                                                    </div>
                                                </div>
                                                <div className="md:col-span-11 grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Meaning Mnemonic</div>
                                                        <div
                                                            className="text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                                                            dangerouslySetInnerHTML={{ __html: formatMnemonic(info.meaning_mnemonic) }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Reading Mnemonic</div>
                                                        <div
                                                            className="text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                                                            dangerouslySetInnerHTML={{ __html: formatMnemonic(info.reading_mnemonic) }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {getKanjiInfo(word).length === 0 && (
                                            <div className="text-gray-500 italic text-sm">No WaniKani data available for kanji in this word.</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setGameState('setup')}
                    className="w-full max-w-md py-4 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95"
                >
                    Play Again
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-[80vh] w-full max-w-2xl mx-auto p-4">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-12">
                <div className="text-xl font-bold text-gray-400">
                    {score} <span className="text-sm font-normal">words</span>
                </div>
                <div className={`text-4xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-gray-100'}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xl font-bold text-gray-400">
                    {category}
                </div>
            </div>

            {/* Word Display */}
            <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
                <div className="text-center">
                    <h1 className="text-6xl md:text-8xl font-bold mb-4 transition-all">
                        {displayKanji ? currentWord?.dictForm : currentWord?.secondary}
                    </h1>
                    {(showAnswer || gameMode === 'fast-typing') && (
                        <div className={`text-3xl md:text-4xl font-medium transition-all ${showAnswer ? 'text-red-500 animate-bounce' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                            {displayKanji ? currentWord?.secondary : currentWord?.dictForm}
                        </div>
                    )}
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className={`w-full text-center text-2xl p-4 rounded-xl border-2 outline-none transition-all ${showAnswer
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                            }`}
                        placeholder={showAnswer ? "Press Enter to continue" : "Type reading..."}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </form>

                {/* Mnemonics (only when incorrect) */}
                {showAnswer && currentWord && (
                    <div className="w-full mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {getKanjiInfo(currentWord).map(({ char, info }) => (
                            <div key={char} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg text-2xl font-bold">
                                        {char}
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500 uppercase tracking-wider font-bold">Readings</div>
                                        <div className="font-medium">
                                            {info.readings.map(r => r.reading).join(', ')}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Meaning Mnemonic</div>
                                        <div
                                            className="text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                                            dangerouslySetInnerHTML={{ __html: formatMnemonic(info.meaning_mnemonic) }}
                                        />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-2">Reading Mnemonic</div>
                                        <div
                                            className="text-sm leading-relaxed text-gray-600 dark:text-gray-300"
                                            dangerouslySetInnerHTML={{ __html: formatMnemonic(info.reading_mnemonic) }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
