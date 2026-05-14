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

export const OUTCOME_POOL = {
  RUNS: [
    { label: '0', weight: 40, runs: 0 },
    { label: '1', weight: 45, runs: 1 },
    { label: '2', weight: 12, runs: 2 },
    { label: '3', weight: 3, runs: 3 },
    { label: '4', weight: 15, runs: 4, isBoundary: true },
    { label: '6', weight: 8, runs: 6, isBoundary: true },
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

export const generateBallResult = (isFreeHit: boolean = false, customWeights?: any): BallResult => {
  const roll = Math.random() * 100;
  
  // Wicket check first (unless free hit)
  const wicketWeight = customWeights?.wicket || 5;
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
  const extraWeight = customWeights?.extra || 6;
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

  // Runs roll
  const totalRunWeight = OUTCOME_POOL.RUNS.reduce((acc, curr) => acc + curr.weight, 0);
  let runRoll = Math.random() * totalRunWeight;
  let selectedRun = OUTCOME_POOL.RUNS[0];
  
  for (const r of OUTCOME_POOL.RUNS) {
    if (runRoll < r.weight) {
      selectedRun = r;
      break;
    }
    runRoll -= r.weight;
  }

  return {
    type: isFreeHit ? 'FREE_HIT' : 'RUNS',
    value: selectedRun.label,
    runs: selectedRun.runs,
    isLegal: true,
    isWicket: false,
    isBoundary: selectedRun.isBoundary
  };
};