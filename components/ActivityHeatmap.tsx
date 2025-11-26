"use client"

import { useState, useEffect } from 'react';

interface DayData {
    date: string;
    count: number;
}

export function ActivityHeatmap({ data }: { data: DayData[] }) {
    const [monthsToShow, setMonthsToShow] = useState(12);
    const [mounted, setMounted] = useState(false);
    const [hoveredData, setHoveredData] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

    useEffect(() => {
        setMounted(true);

        const updateMonthsToShow = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setMonthsToShow(3); // 3 months for very small screens
            } else if (width < 768) {
                setMonthsToShow(4); // 4 months for small screens
            } else if (width < 1024) {
                setMonthsToShow(6); // 6 months for medium screens
            } else {
                setMonthsToShow(12); // Full year for large screens
            }
        };

        updateMonthsToShow();
        window.addEventListener('resize', updateMonthsToShow);
        return () => window.removeEventListener('resize', updateMonthsToShow);
    }, []);

    // Don't render until mounted to avoid SSR mismatch
    if (!mounted) {
        return <div className="h-48 flex items-center justify-center text-gray-500">Loading...</div>;
    }

    // Group data by date
    const dataMap = new Map(data.map(d => [d.date, d.count]));

    // Get max count for color scaling
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Get color based on count
    const getColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 dark:bg-gray-800/50 dark:border dark:border-gray-700/50';
        const intensity = Math.min(count / maxCount, 1);
        if (intensity < 0.25) return 'bg-blue-200 dark:bg-blue-900';
        if (intensity < 0.5) return 'bg-blue-400 dark:bg-blue-700';
        if (intensity < 0.75) return 'bg-blue-600 dark:bg-blue-500';
        return 'bg-blue-800 dark:bg-blue-300';
    };

    // Get all dates
    const dates = data.map(d => new Date(d.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Calculate display range based on screen size
    const daysToShow = monthsToShow * 30;
    const displayMinDate = new Date(Math.max(
        minDate.getTime(),
        maxDate.getTime() - (daysToShow * 24 * 60 * 60 * 1000)
    ));

    // Generate all dates in range
    const allDates: Date[] = [];
    const current = new Date(displayMinDate);
    while (current <= maxDate) {
        allDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    // Group by weeks (starting on Sunday)
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Pad to start on Sunday
    const firstDay = allDates[0];
    const dayOfWeek = firstDay.getDay();
    for (let i = 0; i < dayOfWeek; i++) {
        const paddingDate = new Date(firstDay);
        paddingDate.setDate(firstDay.getDate() - (dayOfWeek - i));
        currentWeek.push(paddingDate);
    }

    allDates.forEach((date) => {
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(date);
    });

    // Pad last week
    while (currentWeek.length < 7) {
        const lastDate = currentWeek[currentWeek.length - 1];
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1);
        currentWeek.push(nextDate);
    }
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    // Get month labels - show month at the first week where it appears
    const monthLabels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    let lastLabelWeek = -5; // Ensure minimum spacing of 4 weeks between labels
    weeks.forEach((week, weekIdx) => {
        const firstDayOfWeek = week[0];
        const month = firstDayOfWeek.getMonth();
        // Only add label if month changed AND we have enough spacing from last label
        if (month !== lastMonth && weekIdx - lastLabelWeek >= 4) {
            monthLabels.push({
                month: firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' }),
                weekIndex: weekIdx
            });
            lastMonth = month;
            lastLabelWeek = weekIdx;
        } else if (month !== lastMonth) {
            // Month changed but not enough spacing, just update lastMonth
            lastMonth = month;
        }
    });

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const cellSize = 12; // w-3 = 12px
    const gap = 4; // gap-1 = 4px

    return (
        <div className="flex flex-col gap-4 relative">
            <div className="flex gap-2">
                <div className="flex flex-col gap-1 justify-around text-xs text-gray-600 dark:text-gray-400 pr-2">
                    {[1, 3, 5].map(i => (
                        <div key={i} className="h-3 flex items-center">{dayLabels[i]}</div>
                    ))}
                </div>
                <div className="flex-1">
                    <div className="relative h-4 mb-1">
                        {monthLabels.map((label) => (
                            <div
                                key={label.weekIndex}
                                className="text-xs text-gray-600 dark:text-gray-400 absolute"
                                style={{ left: `${label.weekIndex * (cellSize + gap)}px` }}
                            >
                                {label.month}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-2">
                        {weeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="flex flex-col gap-1">
                                {week.map((date) => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const count = dataMap.get(dateStr) || 0;
                                    const isOutOfRange = date < displayMinDate || date > maxDate;
                                    return (
                                        <div
                                            key={dateStr}
                                            className={`w-3 h-3 rounded-sm transition-transform duration-200 hover:scale-150 hover:z-10 ${isOutOfRange ? 'bg-transparent' : getColor(count)}`}
                                            onMouseEnter={(e) => {
                                                if (!isOutOfRange) {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoveredData({
                                                        date: dateStr,
                                                        count,
                                                        x: rect.left + rect.width / 2,
                                                        y: rect.top
                                                    });
                                                }
                                            }}
                                            onMouseLeave={() => setHoveredData(null)}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                    <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-900" />
                    <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-700" />
                    <div className="w-3 h-3 rounded-sm bg-blue-600 dark:bg-blue-500" />
                    <div className="w-3 h-3 rounded-sm bg-blue-800 dark:bg-blue-300" />
                </div>
                <span>More</span>
            </div>

            {hoveredData && (
                <div
                    className="fixed z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap"
                    style={{ left: hoveredData.x, top: hoveredData.y - 8 }}
                >
                    <div className="font-bold">{hoveredData.date}</div>
                    <div>{hoveredData.count} words</div>
                </div>
            )}
        </div>
    );
}
