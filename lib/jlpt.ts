import fs from 'fs';
import path from 'path';

export interface JlptKanji {
    id: number;
    kanji: string;
    strokes: number | null;
    radical_number: number | null;
    frequency: number | null;
    jlpt: string | null;
    begins: number | null;
    used_in: number | null;
    component_in: number | null;
    utf: string;
    description: string;
}

let jlptData: Map<string, JlptKanji> | null = null;

export function getJlptData(): Map<string, JlptKanji> {
    if (jlptData) {
        return jlptData;
    }

    try {
        const filePath = path.join(process.cwd(), 'data', 'jlpt_kanji.json');
        if (!fs.existsSync(filePath)) {
            console.warn('JLPT data file not found');
            return new Map();
        }
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const kanjiArray: JlptKanji[] = JSON.parse(fileContents);

        // Create a map for quick lookup by character
        jlptData = new Map();
        kanjiArray.forEach(kanji => {
            jlptData!.set(kanji.kanji, kanji);
        });

        return jlptData;
    } catch (error) {
        console.error('Failed to load JLPT data:', error);
        return new Map();
    }
}
