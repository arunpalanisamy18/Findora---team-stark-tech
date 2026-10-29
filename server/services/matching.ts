import { IItem, Item } from '../models/Item.js';

export interface ScoreDimension {
  score: number;
  max: number;
  reason: string;
}

export interface MatchResult {
  candidate: IItem;
  totalScore: number; // 0 - 100
  confidence: 'high' | 'medium' | 'low';
  breakdown: {
    category: ScoreDimension;
    title: ScoreDimension;
    description: ScoreDimension;
    location: ScoreDimension;
    date: ScoreDimension;
  };
  summary: string;
}

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'lost',
  'found', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with',
  'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersection++;
    }
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function evaluateMatch(source: IItem, candidate: IItem): MatchResult {
  // 1. Category Matching (Max 30 pts)
  const categoryMax = 30;
  let categoryScore = 0;
  let categoryReason = '';

  if (source.category === candidate.category) {
    categoryScore = 30;
    categoryReason = `Exact category match: "${source.category}"`;
  } else {
    categoryScore = 0;
    categoryReason = `Categories differ: "${source.category}" vs "${candidate.category}"`;
  }

  // 2. Title Keyword Matching (Max 25 pts)
  const titleMax = 25;
  const sourceTitleWords = new Set(extractKeywords(source.title));
  const candidateTitleWords = new Set(extractKeywords(candidate.title));
  const sharedTitleWords: string[] = [];

  for (const word of sourceTitleWords) {
    if (candidateTitleWords.has(word)) {
      sharedTitleWords.push(word);
    }
  }

  const titleSimilarity = calculateJaccardSimilarity(sourceTitleWords, candidateTitleWords);
  const normalizedSourceTitle = source.title.toLowerCase().trim();
  const normalizedCandidateTitle = candidate.title.toLowerCase().trim();
  const hasSubstringTitle =
    normalizedSourceTitle.includes(normalizedCandidateTitle) ||
    normalizedCandidateTitle.includes(normalizedSourceTitle);

  let titleScore = 0;
  let titleReason = '';

  if (hasSubstringTitle && (sourceTitleWords.size > 0 || candidateTitleWords.size > 0)) {
    titleScore = 25;
    titleReason = `Titles have direct phrasing overlap: "${source.title}" & "${candidate.title}"`;
  } else if (sharedTitleWords.length >= 2 || titleSimilarity >= 0.5) {
    titleScore = Math.round(18 + Math.min(7, sharedTitleWords.length * 3));
    titleReason = `Shared key title words: ${sharedTitleWords.map((w) => `"${w}"`).join(', ')}`;
  } else if (sharedTitleWords.length === 1) {
    titleScore = 14;
    titleReason = `Shared key title word: "${sharedTitleWords[0]}"`;
  } else {
    titleScore = 0;
    titleReason = 'No overlapping title keywords found';
  }

  // 3. Description Keyword Overlap (Max 20 pts)
  const descMax = 20;
  const sourceDescWords = new Set(extractKeywords(source.description));
  const candidateDescWords = new Set(extractKeywords(candidate.description));
  const sharedDescWords: string[] = [];

  for (const word of sourceDescWords) {
    if (candidateDescWords.has(word)) {
      sharedDescWords.push(word);
    }
  }

  let descScore = 0;
  let descReason = '';

  if (sharedDescWords.length >= 4) {
    descScore = 20;
    descReason = `High descriptive overlap (${sharedDescWords.length} shared terms, e.g. ${sharedDescWords.slice(0, 4).map((w) => `"${w}"`).join(', ')})`;
  } else if (sharedDescWords.length >= 2) {
    descScore = Math.round(10 + sharedDescWords.length * 2.5);
    descReason = `Multiple matching descriptive terms: ${sharedDescWords.map((w) => `"${w}"`).join(', ')}`;
  } else if (sharedDescWords.length === 1) {
    descScore = 6;
    descReason = `Single matching descriptive term: "${sharedDescWords[0]}"`;
  } else {
    descScore = 0;
    descReason = 'No overlapping descriptive keywords';
  }

  // 4. Location Proximity (Max 15 pts)
  const locMax = 15;
  const sourceLocWords = new Set(extractKeywords(source.location));
  const candidateLocWords = new Set(extractKeywords(candidate.location));
  const sharedLocWords: string[] = [];

  for (const word of sourceLocWords) {
    if (candidateLocWords.has(word)) {
      sharedLocWords.push(word);
    }
  }

  const normSourceLoc = source.location.toLowerCase().trim();
  const normCandidateLoc = candidate.location.toLowerCase().trim();
  let locScore = 0;
  let locReason = '';

  if (normSourceLoc === normCandidateLoc) {
    locScore = 15;
    locReason = `Identical location reported: "${source.location}"`;
  } else if (
    normSourceLoc.includes(normCandidateLoc) ||
    normCandidateLoc.includes(normSourceLoc) ||
    sharedLocWords.length >= 2
  ) {
    locScore = 12;
    locReason = `Matching location area (${sharedLocWords.length > 0 ? sharedLocWords.join(', ') : source.location})`;
  } else if (sharedLocWords.length === 1) {
    locScore = 8;
    locReason = `Shared location term: "${sharedLocWords[0]}"`;
  } else {
    locScore = 0;
    locReason = `Different reported locations ("${source.location}" vs "${candidate.location}")`;
  }

  // 5. Date Proximity (Max 10 pts)
  const dateMax = 10;
  const dateDiffMs = Math.abs(new Date(source.date).getTime() - new Date(candidate.date).getTime());
  const diffDays = Math.floor(dateDiffMs / (1000 * 60 * 60 * 24));
  let dateScore = 0;
  let dateReason = '';

  if (diffDays <= 1) {
    dateScore = 10;
    dateReason = diffDays === 0 ? 'Reported on the same calendar day' : 'Reported 1 day apart';
  } else if (diffDays <= 3) {
    dateScore = 8;
    dateReason = `Reported within ${diffDays} days of each other`;
  } else if (diffDays <= 7) {
    dateScore = 6;
    dateReason = `Reported within 1 week (${diffDays} days apart)`;
  } else if (diffDays <= 14) {
    dateScore = 4;
    dateReason = `Reported within 2 weeks (${diffDays} days apart)`;
  } else if (diffDays <= 30) {
    dateScore = 2;
    dateReason = `Reported within 1 month (${diffDays} days apart)`;
  } else {
    dateScore = 0;
    dateReason = `Dates separated by ${diffDays} days (> 30 days)`;
  }

  const totalScore = categoryScore + titleScore + descScore + locScore + dateScore;

  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (totalScore >= 70) {
    confidence = 'high';
  } else if (totalScore >= 40) {
    confidence = 'medium';
  }

  let summary = '';
  if (confidence === 'high') {
    summary = `Strong candidate match (${totalScore}%): matches category and exhibits significant title, description, and temporal alignment.`;
  } else if (confidence === 'medium') {
    summary = `Potential candidate match (${totalScore}%): overlaps in category or key keywords, but differs in location or timing.`;
  } else {
    summary = `Weak match (${totalScore}%): minimal overlap in details.`;
  }

  return {
    candidate,
    totalScore,
    confidence,
    breakdown: {
      category: { score: categoryScore, max: categoryMax, reason: categoryReason },
      title: { score: titleScore, max: titleMax, reason: titleReason },
      description: { score: descScore, max: descMax, reason: descReason },
      location: { score: locScore, max: locMax, reason: locReason },
      date: { score: dateScore, max: dateMax, reason: dateReason },
    },
    summary,
  };
}

export async function findMatchesForItem(
  sourceItem: IItem,
  minScoreThreshold = 25,
  limit = 10
): Promise<MatchResult[]> {
  // Candidate pool: opposite item type, not recovered/closed, not the same item
  const targetType = sourceItem.type === 'lost' ? 'found' : 'lost';

  const candidates = await Item.find({
    _id: { $ne: sourceItem._id },
    type: targetType,
    status: { $in: ['open', 'matched', 'claimed'] },
  }).lean();

  const results: MatchResult[] = [];

  for (const candidate of candidates) {
    const match = evaluateMatch(sourceItem, candidate as unknown as IItem);
    if (match.totalScore >= minScoreThreshold) {
      results.push(match);
    }
  }

  // Sort by highest score first
  results.sort((a, b) => b.totalScore - a.totalScore);

  return results.slice(0, limit);
}

