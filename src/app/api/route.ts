import { NextResponse } from "next/server";

export async function GET() {
    const res = await fetch('https://api.weather.gov/gridpoints/ILM/90,52/forecast');
    const data = await res.json();

    const periods = data.properties.periods;

    return NextResponse.json({
        message: "BHI Weather Report",
        periods
    }, {
        status: 200,
    });
}