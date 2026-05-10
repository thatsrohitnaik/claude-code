// Keyword detection for AI keyword template flow

const KEYWORD_PATTERNS = [
  /\b(vehicle|car|bike|motorcycle|scooter|ev|electric vehicle)\b/i,
  /\b(groceries|grocery|shopping|supermarket|provisions)\b/i,
  /\b(dog|cat|pet|fish|bird|puppy|kitten)\b/i,
  /\b(baby|infant|toddler|child|kid|son|daughter)\b/i,
  /\b(plant|garden|flower|balcony garden|terrace)\b/i,
  /\b(business|freelance|startup|clients|invoices)\b/i,
  /\b(travel|trip|vacation|holiday)\b/i,
];

const INTENT_PATTERNS = [
  /set up.*reminders? for/i,
  /remind me (about|for|to track)/i,
  /help me (stay on top of|track|manage)/i,
  /create.*checklist for/i,
  /what should i track.*for/i,
];

export function detectKeywordIntent(message: string): boolean {
  const lowerMsg = message.toLowerCase();

  const hasKeyword = KEYWORD_PATTERNS.some(p => p.test(lowerMsg));
  const hasIntent = INTENT_PATTERNS.some(p => p.test(lowerMsg));

  return hasKeyword || hasIntent;
}

export function extractKeyword(message: string): string | null {
  const lowerMsg = message.toLowerCase();

  // Map detected patterns to canonical keywords
  const keywordMap: Record<string, string> = {
    'vehicle': 'vehicle',
    'car': 'car',
    'bike': 'bike',
    'motorcycle': 'vehicle',
    'scooter': 'vehicle',
    'ev': 'vehicle',
    'electric vehicle': 'vehicle',
    'groceries': 'groceries',
    'grocery': 'groceries',
    'shopping': 'groceries',
    'supermarket': 'groceries',
    'provisions': 'groceries',
    'dog': 'dog',
    'cat': 'cat',
    'pet': 'pet',
    'fish': 'pet',
    'bird': 'pet',
    'puppy': 'dog',
    'kitten': 'cat',
    'baby': 'baby',
    'infant': 'baby',
    'toddler': 'baby',
    'child': 'baby',
    'kid': 'baby',
    'son': 'baby',
    'daughter': 'baby',
    'plant': 'plant',
    'garden': 'garden',
    'flower': 'plant',
    'balcony garden': 'plant',
    'terrace': 'plant',
    'business': 'business',
    'freelance': 'business',
    'startup': 'business',
    'clients': 'business',
    'invoices': 'business',
    'travel': 'travel',
    'trip': 'travel',
    'vacation': 'travel',
    'holiday': 'travel',
  };

  for (const [pattern, keyword] of Object.entries(keywordMap)) {
    if (lowerMsg.includes(pattern)) {
      return keyword;
    }
  }

  return null;
}