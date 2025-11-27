import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');

    if (!term) {
        return NextResponse.json({ error: 'Term is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(term)}`);

        if (!response.ok) {
            throw new Error(`Jisho API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching from Jisho:', error);
        return NextResponse.json({ error: 'Failed to fetch dictionary data' }, { status: 500 });
    }
}
