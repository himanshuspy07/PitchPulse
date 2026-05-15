export type BallOutcomeType = 'RUNS' | 'WICKET' | 'EXTRA' | 'FREE_HIT';

export interface BallResult {
  type: BallOutcomeType;
  value: string;
  runs: number;
  isLegal: boolean;
  isWicket: boolean;
  wicketType?: string;
  extraType?: string;
  isBoundary?: boolean;
}

export type MatchFormat = 'T20' | 'ODI' | 'TEST';
export type BattingStrategy = 'DEFENSIVE' | 'BALANCED' | 'AGGRESSIVE';

export const MATCH_FORMAT_CONFIGS: Record<MatchFormat, {
  maxOvers: number;
  wicketWeight: number;
  extraWeight: number;
  runWeights: number[]; // Weights for [0, 1, 2, 3, 4, 6]
}> = {
  T20: {
    maxOvers: 20,
    wicketWeight: 5.5,
    extraWeight: 7,
    runWeights: [30, 40, 10, 2, 12, 6]
  },
  ODI: {
    maxOvers: 50,
    wicketWeight: 3.5,
    extraWeight: 5,
    runWeights: [45, 35, 12, 3, 4, 1]
  },
  TEST: {
    maxOvers: 90, // Per day limit usually
    wicketWeight: 2.2,
    extraWeight: 3,
    runWeights: [65, 20, 8, 4, 2, 1]
  }
};

export const OUTCOME_POOL = {
  RUNS: [
    { label: '0', runs: 0 },
    { label: '1', runs: 1 },
    { label: '2', runs: 2 },
    { label: '3', runs: 3 },
    { label: '4', runs: 4, isBoundary: true },
    { label: '6', runs: 6, isBoundary: true },
  ],
  EXTRAS: [
    { label: 'WD', weight: 5, runs: 1, type: 'Wide' },
    { label: 'NB', weight: 2, runs: 1, type: 'No-Ball' },
    { label: 'BYE', weight: 2, runs: 1, type: 'Bye' },
    { label: 'LB', weight: 2, runs: 1, type: 'Leg-Bye' },
  ],
  WICKETS: [
    { label: 'Bowled', weight: 3 },
    { label: 'Caught', weight: 5 },
    { label: 'LBW', weight: 2 },
    { label: 'Run Out', weight: 1 },
    { label: 'Stumped', weight: 1 },
    { label: 'Caught & Bowled', weight: 0.5 },
  ]
};

export const generateBallResult = (
  format: MatchFormat = 'T20', 
  isFreeHit: boolean = false, 
  options?: { 
    wicketWeight?: number | null, 
    extraWeight?: number | null,
    strategy?: BattingStrategy 
  }
): BallResult => {
  const config = MATCH_FORMAT_CONFIGS[format];
  
  // Base values
  let wicketWeight = options?.wicketWeight ?? config.wicketWeight;
  let extraWeight = options?.extraWeight ?? config.extraWeight;
  let runWeights = [...config.runWeights];

  // Strategy Modifiers
  const strategy = options?.strategy ?? 'BALANCED';
  if (strategy === 'AGGRESSIVE') {
    wicketWeight *= 1.6; // Higher risk of out
    runWeights[0] *= 0.5; // Fewer dots
    runWeights[4] *= 1.8; // More boundaries
    runWeights[5] *= 2.5; // More sixes
  } else if (strategy === 'DEFENSIVE') {
    wicketWeight *= 0.4; // Lower risk of out
    runWeights[0] *= 1.5; // More dots
    runWeights[1] *= 1.2; // Focus on singles
    runWeights[4] *= 0.2; // Fewer boundaries
    runWeights[5] *= 0.1; // Almost no sixes
  }

  const roll = Math.random() * 100;
  
  // Wicket check (unless free hit)
  if (!isFreeHit && roll < wicketWeight) {
    const totalWicketWeight = OUTCOME_POOL.WICKETS.reduce((acc, curr) => acc + curr.weight, 0);
    let wicketRoll = Math.random() * totalWicketWeight;
    let selectedWicket = OUTCOME_POOL.WICKETS[0];
    
    for (const w of OUTCOME_POOL.WICKETS) {
      if (wicketRoll < w.weight) {
        selectedWicket = w;
        break;
      }
      wicketRoll -= w.weight;
    }
    
    return {
      type: 'WICKET',
      value: 'OUT',
      runs: 0,
      isLegal: true,
      isWicket: true,
      wicketType: selectedWicket.label
    };
  }

  // Extra check
  if (roll < wicketWeight + extraWeight) {
    const totalExtraWeight = OUTCOME_POOL.EXTRAS.reduce((acc, curr) => acc + curr.weight, 0);
    let extraRoll = Math.random() * totalExtraWeight;
    let selectedExtra = OUTCOME_POOL.EXTRAS[0];
    
    for (const e of OUTCOME_POOL.EXTRAS) {
      if (extraRoll < e.weight) {
        selectedExtra = e;
        break;
      }
      extraRoll -= e.weight;
    }

    return {
      type: 'EXTRA',
      value: selectedExtra.label,
      runs: selectedExtra.runs,
      isLegal: selectedExtra.type !== 'Wide' && selectedExtra.type !== 'No-Ball',
      isWicket: false,
      extraType: selectedExtra.type
    };
  }

  // Runs roll using (potentially strategy-modified) weights
  const totalRunWeight = runWeights.reduce((acc, curr) => acc + curr, 0);
  let runRoll = Math.random() * totalRunWeight;
  let selectedRunIndex = 0;
  
  for (let i = 0; i < runWeights.length; i++) {
    if (runRoll < runWeights[i]) {
      selectedRunIndex = i;
      break;
    }
    runRoll -= runWeights[i];
  }

  const selectedRun = OUTCOME_POOL.RUNS[selectedRunIndex];

  return {
    type: isFreeHit ? 'FREE_HIT' : 'RUNS',
    value: selectedRun.label,
    runs: selectedRun.runs,
    isLegal: true,
    isWicket: false,
    isBoundary: selectedRun.isBoundary
  };
};