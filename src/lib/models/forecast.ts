import { DateTime } from "luxon";

export interface Forecast {
    number: number
    name: string
    startTime: DateTime;
    endTime: DateTime;
    isDaytime: boolean
    temperature: number
    temperatureUnit: string
    temperatureTrend: string
    probabilityOfPrecipitation: ProbabilityOfPrecipitation
    windSpeed: string
    windDirection: string
    icon: string
    shortForecast: string
    detailedForecast: string
  }
  
  export interface ProbabilityOfPrecipitation {
    unitCode: string
    value: number
  }
  