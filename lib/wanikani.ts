import fs from 'fs';
import path from 'path';

export interface WaniKaniReading {
    type: string;
    reading: string;
}

export interface WaniKaniKanji {
    id: number;
    character: string;
    meanings: string[];
    readings: WaniKaniReading[];
    level: number;
    slug: string;
    meaning_mnemonic: string;
    reading_mnemonic: string;
}

let waniKaniData: Map<string, WaniKaniKanji> | null = null;

export function getWaniKaniData(): Map<string, WaniKaniKanji> {
    if (waniKaniData) {
        return waniKaniData;
    }

    try {
        const filePath = path.join(process.cwd(), 'data', 'wanikani_kanji.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const kanjiArray: WaniKaniKanji[] = JSON.parse(fileContents);

        // Create a map for quick lookup by character
        waniKaniData = new Map();
        kanjiArray.forEach(kanji => {
            waniKaniData!.set(kanji.character, kanji);
        });

        return waniKaniData;
    } catch (error) {
        console.error('Failed to load WaniKani data:', error);
        return new Map();
    }
}

export function getKanjiInfo(character: string): WaniKaniKanji | undefined {
    const data = getWaniKaniData();
    return data.get(character);
}
