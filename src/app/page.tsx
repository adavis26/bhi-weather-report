import { Forecast } from '@/lib/models/forecast';
import { Historical } from '@/lib/models/historical';
import { DateTime } from 'luxon';

export const dynamic = 'force-dynamic'
export const revalidate = 300; // invalidate every hour

export default async function Home() {
  const base = process.env.NEXT_PUBLIC_API_BASE as string;
  console.log(base);
  const res = await fetch(`${base}`);
  const historicalRes = await fetch(`${base}/historical`);

  const data = await res.json();
  const historicalData = await historicalRes.json();

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

  const dayScore = periods.filter((period: Forecast) => period.isDaytime).reduce((acc: { period: string; score: number; tempScore: number; dryScore: number }[], period: Forecast) => {
    const rainChance = period.probabilityOfPrecipitation.value ?? 0;
    let dryScore = rainChance ? 5 * (rainChance / 100) : 5;

    let tempScore = 0;
    const temp = period.temperature;

    if (temp >= 70 && temp < 95) {
      tempScore = 5;
    } else if (temp >= 60) {
      tempScore = 4;
    } else if (temp >= 50 || temp >= 95) {
      tempScore = 3;
    } else if (temp >= 40 && temp < 50) {
      tempScore = 2;
    } else {
      tempScore = 1;
    }

    dryScore = dryScore * 0.8;
    tempScore = tempScore * 1.2;
    const score = dryScore + tempScore;

    acc.push({
      period: period.name,
      score: score,
      dryScore: dryScore,
      tempScore: tempScore,
    });

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

  return (
    <div className="space-y-3 m-10">
      <div className="">
        <h1 className="text-2xl">BHI Weather Report</h1>
        <p className='mt-5 text-xs text-gray'>Next 7 Days</p>
      </div>
      <div className="grid grid-cols-1 gap-5">
        {periods.length > 0 && periods.filter((period: Forecast) => period.isDaytime).map(
          (period: Forecast) => {
            const { score } = dayScore.find((score: { score: number; period: string; }) => score.period === period.name);
            return (
              <div key={period.number} className={`p-2 bg-gray-300 rounded grid grid-cols-2 md:grid-cols-5 place-items-center gap-3 w-full justify-evenly ${getScoreBg(score)}`}>
                <div className='h-8 text-center bg-white p-1 rounded-full pl-2'>{period.temperature}°</div>
                <div className='text-center'>
                  <p>{period.name}</p>
                  <p className='text-xs'>{period.startTime.toFormat("EEE MMM d")} - {period.endTime.toFormat("ha")}</p>
                </div>
                <div className='text-xs flex'>
                  <p>{period.shortForecast}</p>
                  {/* {period.probabilityOfPrecipitation.value && <div className='flex space-x-1'><CloudIcon className='size-6 text-gray-500 border-b-blue-500  border-b-2 border-dotted'></CloudIcon> <p>{period.probabilityOfPrecipitation.value ?? 0}%</p></div>} */}
                </div>
                <div className='text-xs'>
                  <p>Score: {score.toFixed(1)}</p>
                </div>
              </div>)
          }
        )}
      </div>

      <div className='py-5'>
        <hr />
      </div>
      <h1>Extended Forecast</h1>
      <div className="grid grid-cols-1 gap-5">
        {historicalDataFiltered.map((day: Historical) => (<div key={day.date} className={`p-2 border rounded grid grid-cols-3 lg:grid-cols-5 place-items-center gap-3 w-full justify-evenly`}>
          <div className="flex flex-col">
            <p><span className='text-red-300'>H</span> {Math.round(day.avgMaxTemp)}°</p>
            <p><span className='text-blue-300'>L</span> {Math.round(day.avgMinTemp)}°</p>
          </div>
          <p>{DateTime.now().set({ month: +day.date.split('-')[0], day: +day.date.split('-')[1] }).toFormat('EEE MMM dd')}</p>
          <div>
            <p>{day.yearlyPrecipitation.filter((precipiation: number) => precipiation > 0).length} <span className="text-xs">of</span> {day.yearlyPrecipitation.length} years</p>
            <p className='text-xs'>Rain on this day</p>
          </div>
        </div>))}
      </div>
    </div>
  );
}
