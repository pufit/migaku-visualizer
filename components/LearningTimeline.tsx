"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimelineData {
    date: number;
    count: number;
}

export function LearningTimeline({ data }: { data: TimelineData[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="date"
                    scale="time"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    }}
                />
                <YAxis />
                <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}
