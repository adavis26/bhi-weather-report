export interface Historical {
    date: string;
    avgTemp: number;
    avgPrecipitation: number;
    avgMinTemp: number;
    avgMaxTemp: number;
    yearlyPrecipitation: number[];
    yearlyMinTemp: number[];
    yearlyMaxTemp: number[];
}