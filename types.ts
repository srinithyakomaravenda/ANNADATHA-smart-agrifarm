export type Language = 'en' | 'te' | 'hi';

export type SoilType = 'Alluvial' | 'Black' | 'Red' | 'Laterite' | 'Desert';

export interface CropSpec {
  soil: SoilType;
  minPH: number;
  maxPH: number;
  minN: number;
  maxN: number;
  minP: number;
  maxP: number;
  minK: number;
  maxK: number;
}

export interface CropEconomy {
  yld: number; // Yield in Quintals per hectare
  cost: number; // Cost of production per hectare
  msp: number; // Minimum Support Price per Quintal
}

export interface AnalysisResult {
  bestCrop: string;
  top3: string[];
  estimatedYield: number;
  netProfit: number;
  advice: string;
}
