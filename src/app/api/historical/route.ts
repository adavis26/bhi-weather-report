import { NextResponse } from "next/server";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

export async function GET() {
    const csvFilePath = path.join(process.cwd(), 'public', 'data', 'wilmington_historical.csv');
    const file = fs.readFileSync(csvFilePath, "utf8");

    const result = Papa.parse(file, {
        header: true, // Convert rows to objects using headers
        skipEmptyLines: true,
    });

    const dayMonthData = (result.data as { DATE: string, TMIN: string, TMAX: string, PRCP: string }[]).reduce((acc: { [key: string]: { min: number, max: number, date: string, avgTemp: number; precipitation: number }[] }, row: { DATE: string, TMIN: string, TMAX: string, PRCP: string }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, month, day] = row["DATE"].split("-");

        const monthDay = `${month}-${day}`;
        if (!acc[monthDay]) {
            acc[monthDay] = [];
        };

        acc[monthDay].push({
            date: row["DATE"],
            min: +row["TMIN"],
            max: +row["TMAX"],
            avgTemp: (+row["TMIN"] + +row["TMAX"]) / 2,
            precipitation: +row["PRCP"],
        })
        return acc;

    }, {});

    const dailyAverages = Object.keys(dayMonthData).map((key) => {
        const dailyData = dayMonthData[key];

        const avgTemp = dailyData.reduce((acc, row) => acc + row.avgTemp, 0) / dailyData.length;
        const avgMinTemp = dailyData.reduce((acc, row) => acc + row.min, 0) / dailyData.length;
        const avgMaxTemp = dailyData.reduce((acc, row) => acc + row.max, 0) / dailyData.length;
        const avgPrecipitation = dailyData.reduce((acc, row) => acc + row.precipitation, 0) / dailyData.length;

        return {
            date: key,
            avgTemp,
            avgPrecipitation,
            avgMinTemp,
            avgMaxTemp,
            yearlyPrecipitation: dailyData.map(day => day.precipitation),
            yearlyMaxTemp: dailyData.map(day => day.max),
            yearlyMinTemp: dailyData.map(day => day.min),
        };
    });

    return NextResponse.json(dailyAverages, {
        status: 200,
    });
}