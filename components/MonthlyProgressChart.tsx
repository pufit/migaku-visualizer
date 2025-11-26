"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyData {
    month: string;
    count: number;
}

export function MonthlyProgressChart({ data }: { data: MonthlyData[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
                    dataKey="month"
                    tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1);
                        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                    }}
                />
                <YAxis />
                <Tooltip
                    labelFormatter={(value) => {
                        const [year, month] = value.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1);
                        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }}
                />
                <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    );
}
