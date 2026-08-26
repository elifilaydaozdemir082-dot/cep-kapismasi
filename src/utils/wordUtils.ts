export const TURKISH_ALPHABET = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'
];

export const VOWELS = ['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü'];

export function toTurkishUpper(text: string): string {
  if (!text) return '';
  return text.toLocaleUpperCase('tr-TR');
}

export function toTurkishLower(text: string): string {
  if (!text) return '';
  return text.toLocaleLowerCase('tr-TR');
}

export function sanitizeWord(text: string): string {
  if (!text) return '';
  return toTurkishUpper(text.trim());
}

export function containsForbiddenLetter(word: string, forbiddenLetter: string): boolean {
  const normWord = toTurkishUpper(word);
  const normLetter = toTurkishUpper(forbiddenLetter);
  return normWord.includes(normLetter);
}

export function getRandomTurkishLetter(): string {
  const index = Math.floor(Math.random() * TURKISH_ALPHABET.length);
  return TURKISH_ALPHABET[index];
}

export function shuffleLetters(word: string): string[] {
  const letters = toTurkishUpper(word).split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Ensure shuffled letters don't match the exact original word if length > 1
  if (letters.join('') === toTurkishUpper(word) && letters.length > 1) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }
  return letters;
}
