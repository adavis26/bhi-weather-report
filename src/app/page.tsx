import Live from '@/components/live';
import { http } from '@/lib/http/http';
import { Forecast } from '@/lib/models/forecast';
import { Historical } from '@/lib/models/historical';
import { DateTime } from 'luxon';

export const dynamic = 'force-dynamic'
export const revalidate = 300; // invalidate every hour

export default async function Home() {
  const [data, historicalData] = await Promise.all([http('/'), http('/historical')]);

  const periods = data.periods.map((period: Forecast) => {
    const startTime = DateTime.fromISO(period.startTime as unknown as string);
    const endTime = DateTime.fromISO(period.endTime as unknown as string);

    return {
      ...period,
      startTime,
      endTime
    };
  });


  const getScoreBg = (score: number): string => {
    if (score >= 10) {
      return 'bg-green-600';
    } else if (score >= 9) {
      return 'bg-green-500'
    } else if (score >= 8) {
      return 'bg-green-400';
    } else if (score >= 7) {
      return 'bg-green-200';
    } else if (score >= 6) {
      return 'bg-blue-100';
    } else {
      return 'bg-gray-200'
    }
  }

  const tempBorderColor = (score: number): string => {
    if (score >= 5) {
      return 'border-green-600';
    } else if (score >= 4) {
      return 'border-green-500'
    } else if (score >= 3) {
      return 'border-green-400';
    } else if (score >= 2) {
      return 'border-green-200';
    } else if (score >= 1) {
      return 'border-blue-100';
    } else {
      return 'border-gray-200'
    }
  }

  const getIcon = (shortForecast: string): string => {
    const convertedForecast = shortForecast.toLowerCase().includes('rain') ? 'rain' : shortForecast;

    switch (convertedForecast) {
      case 'Sunny':
        return '☀️';
      case 'Mostly Sunny':
        return '🌤️';
      case 'Partly Sunny':
        return '⛅';
      case 'Mostly Cloudy':
        return '☁️';
      case 'Cloudy':
        return '☁️';
      case 'rain':
        return '🌧️';
      case 'Clear':
        return '☀️';
      case 'Mostly Clear':
        return '🌤️';
      case 'Partly Cloudy':
        return '⛅';
      case 'Mostly Cloudy':
        return '☁️';
      case 'Partly Cloudy':
        return '⛅';
      default:
        return '?';
    }
  }

  const getRainHistoricalPerc = (yearlyPrecipitation: number[]): number => {
    return yearlyPrecipitation.filter((precipiation: number) => precipiation > 0).length / yearlyPrecipitation.length * 100
  }

  const processScore = (temp: number, rainChance: number, date: string) => {
    let dryScore = rainChance ? 5 * (rainChance / 100) : 5;

    let tempScore = 0;

    if (temp >= 70 && temp < 95) {
      tempScore = 5;
    } else if (temp >= 60) {
      tempScore = 4;
    } else if (temp >= 55) {
      tempScore = 3;
    } else if (temp >= 50 || temp >= 95) {
      tempScore = 2;
    } else if (temp >= 40 && temp < 50) {
      tempScore = 1;
    } else {
      tempScore = 0;
    }

    dryScore = dryScore * 0.8;
    tempScore = tempScore * 1.2;
    const score = dryScore + tempScore;

    return {
      period: date,
      score: score,
      dryScore: dryScore,
      tempScore: tempScore,
    }
  }

  const dayScore = periods.filter((period: Forecast) => period.isDaytime).reduce((acc: { period: string; score: number; tempScore: number; dryScore: number }[], period: Forecast) => {
    const rainChance = period.probabilityOfPrecipitation.value ?? 0;
    const score = processScore(period.temperature, rainChance, period.name);
    acc.push(score);
    return acc;
  }, [])

  const getNext14Days = (startDate: string): string[] => {
    const start = DateTime.fromISO(startDate);
    const dates = [];

    for (let i = 1; i <= 14; i++) {
      dates.push(start.plus({ days: i }).toFormat('yyyy-MM-dd'));
    }

    return dates;
  };

  const next14Days = getNext14Days(periods[periods.length - 1].startTime.toISODate()).map(date => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_year, month, day] = date.split('-');
    return `${month}-${day}`;
  });

  const historicalDataFiltered = historicalData.filter((day: { date: string; }) => next14Days.includes(day.date));

  const predictionScoresOptimistic = historicalDataFiltered.map((day: Historical) => processScore(day.avgMaxTemp, 0, day.date))

  const predictionScoresRain = historicalDataFiltered.map((day: Historical) => {
    const rainChance = getRainHistoricalPerc(day.yearlyPrecipitation);

    return processScore(day.avgMaxTemp, rainChance, day.date);
  })

  return (
    <div className="space-y-3 m-10">
      <div className='mb-10'>
        <h1 className="text-3xl ">BHI Weather Report</h1>
      </div>
      <div className='flex justify-between flex-col space-y-3'>
        <p className="text-xl">Report</p>
        <Live></Live>
        <p className='text-xs text-gray'>Next 7 Days</p>
      </div>
      <div className="grid grid-cols-1 gap-5">
        {periods.length > 0 && periods.filter((period: Forecast) => period.isDaytime).map(
          (period: Forecast) => {
            const { score, tempScore } = dayScore.find((score: { score: number; period: string; }) => score.period === period.name);
            return (
              <div key={period.number} className={`p-2 bg-gray-300 rounded grid grid-cols-2 md:grid-cols-5 place-items-center gap-2 w-full justify-evenly ${getScoreBg(score)}`}>
                <div className={`text-center border-2 shadow bg-white p-1 rounded-full pl-2 ` + tempBorderColor(tempScore)}>{period.temperature}°</div>
                <div className='text-xs flex'>
                  <p className="text-3xl">{getIcon(period.shortForecast)}</p>
                </div>
                <div className='text-center'>
                  <p>{period.name}</p>
                  <p className='text-xs'>{period.startTime.toFormat("MMM d")}</p>
                </div>
                <div className=''>
                  <p>{score.toFixed(1)} <span className='text-xs'>Score</span></p>
                </div>
              </div>)
          }
        )}
      </div>

      <div className='py-5'>
        <hr />
      </div>
      <p className="text-xl">Predictions</p>
      <p className='text-xs text-gray-500'>Using historical weather data over 8 years (2016-2024)</p>
      <div className="grid grid-cols-1 gap-5">
        {historicalDataFiltered.map((day: Historical) => {
          const { score: scoreOptimistic } = predictionScoresOptimistic.find((score: { period: string; }) => score.period === day.date);
          const { score: scoreRain } = predictionScoresRain.find((score: { period: string; }) => score.period === day.date);

          console.log(scoreOptimistic, scoreRain);
          const predictedScore = (scoreOptimistic + scoreRain) / 2;

          return (<div key={day.date} className={`p-2 border rounded grid grid-cols-3 lg:grid-cols-5 place-items-center gap-3 w-full justify-evenly ${getScoreBg(predictedScore)}`}>
            <div className='text-center'>
              <p>{DateTime.now().set({ month: +day.date.split('-')[0], day: +day.date.split('-')[1] }).toFormat('EEEE')}</p>
              <p className='text-xs'>{DateTime.now().set({ month: +day.date.split('-')[0], day: +day.date.split('-')[1] }).toFormat('MMM d')}</p>
            </div>
            <div className="flex flex-col text-center">
              <p><span className='text-red-300'>H</span> {Math.round(day.avgMaxTemp)}°</p>
              <p><span className='text-blue-300'>L</span> {Math.round(day.avgMinTemp)}°</p>
            </div>
            <div>
              <p>{predictedScore.toFixed(1)}</p>
              <p className='text-[10px]'>Predicted Score</p>
            </div>
          </div>)
        })}
      </div>
    </div>
  );
}
