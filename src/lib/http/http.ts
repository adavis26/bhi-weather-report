export async function http(path: string, method = 'GET') {
    const base = process.env.NEXT_PUBLIC_API_BASE as string;
    const url = `${base}${path}`;
    const res = await fetch(url, { method });

    if (!res.ok) {
        throw new Error(`Failed: ${url} - ${res.statusText}`);
    }

    return await res.json();
}