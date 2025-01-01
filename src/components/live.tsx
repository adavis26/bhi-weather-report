"use client";

import { useState } from "react";

function LiveFrame() {
    const liveYoutubeUrl = 'https://www.youtube.com/embed/lcANlrXCR0Q?si=2WwM6KoJJvdPSDJy';
    return <div className='shadow-lg rounded'>
        <iframe className="w-full rounded-lg min-h-[300px] lg:min-h-[400px]"
            src={liveYoutubeUrl}
            title="Live Stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
        ></iframe>
    </div>
}

export default function Live() {
    const [show, setShow] = useState(false);

    return (
        <div>
            <button className="border shadow px-2 rounded flex mb-2" onClick={() => setShow(!show)}><div className="h-2 w-2 mt-2 mr-1 rounded-full animate-pulse bg-green-400"></div>{show ? 'Hide' : 'Show'} Live</button>
            {show && <LiveFrame></LiveFrame>}
        </div>
    )
}