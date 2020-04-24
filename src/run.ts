import fetch from 'node-fetch';
import * as path from 'path';
import * as fsRaw from 'fs';
import * as util from 'util';
export const fs = {
    appendFile: util.promisify(fsRaw.appendFile),
};

const TIMEOUT = 10000;
const TIME_WARN = 500;
const KBPS_WARN = 1000000;
const TICK_TIME = 1000;
const SETTINGS = { outDir: `../reports` };

const appendToFile = async (text: string) => {
    const path = `${SETTINGS.outDir}/results_${new Date().toISOString().substr(0, 10)}.txt`;
    fs.appendFile(path, text);
};

const logInfo = async (message: string) => {
    console.log(message);
    // appendToFile(`${new Date().toISOString()} \tINFO    \t${message}\n`);
};
const logWarning = async (message: string) => {
    console.warn(message);
    appendToFile(`${new Date().toISOString()} \tSLOW    \t${message}\n`);
};
const logError = async (message: string) => {
    console.error(message);
    appendToFile(`${new Date().toISOString()} \tTIMEOUT \t${message}\n`);
};

const getTimeSinceMs = (timeStart: number[]) => {
    const timeEnd = process.hrtime();
    const timeDelta = { sec: timeEnd[0] - timeStart[0], ns: timeEnd[1] - timeStart[1] };
    const timeDeltaMs = timeDelta.ns / 1000000 + timeDelta.sec * 1000;
    return timeDeltaMs | 0;
};

const tryFetch = async (name: string, url: string, timeout = TIMEOUT) => {
    const timeStart = process.hrtime();

    try {
        const response = await fetch(url, { timeout });
        const blob = await response.blob();
        const timeDeltaMs = getTimeSinceMs(timeStart);
        const size = blob.size;
        const bps = (size * 1000 / timeDeltaMs) | 0;
        const kbps = bps / 1000;
        const message = `ms=${(timeDeltaMs + '').padStart(6, ' ')} \tsize=${(size + '').padStart(9, ' ')} \tkbps=${(kbps + '').padStart(8, ' ')} \t${name} \t${url}`;

        if (!response.ok) {
            logError(`${message} \tERROR RESPONSE \t${response.status} \t${response.statusText}`);
        } else if (timeDeltaMs > TIME_WARN && kbps < KBPS_WARN) {
            logWarning(message);
        } else {
            logInfo(message);
        }
    } catch (err) {
        const timeDeltaMs = getTimeSinceMs(timeStart);
        const message = `ms=${(timeDeltaMs + '').padStart(6, ' ')} \t${name} \t${url} \tUNKNOWN ERROR `;
        logError(message);
    }
};

const calls = [
    { name: 'GoogleFavIcon', url: 'http://www.google.com/images/google_favicon_128.png' },
    { name: 'Bing__FavIcon', url: 'http://www.bing.com/s/a/bing_p.ico' },
    { name: 'AmazonFavIcon', url: 'https://www.amazon.com/favicon.ico' },
    { name: 'Apple_FavIcon', url: 'https://www.apple.com/favicon.ico' },
    { name: 'WIFI__FavIcon', url: 'http://192.168.1.1/0.1/gui/images/faviconNone.ico' },
];

const largeCalls = [
    { name: 'ReactDomJsCDN', url: 'https://unpkg.com/react-dom@16.13.1/umd/react-dom.production.min.js' },
    { name: 'AmazonImageLG', url: 'https://images-na.ssl-images-amazon.com/images/S/amazonlive-media-prod/broadcast/3/3954005c-5c84-4157-b6a4-567710c59414_20200423130720/image/slate.jpg' },
    { name: 'AppleScriptLG', url: 'https://www.apple.com/metrics/ac-analytics/2.9.0/scripts/ac-analytics.js' },
    { name: 'Azure_ImageLG', url: 'https://azurecomcdn.azureedge.net/cvt-7e63ee798fb5c57c26a10e5149d1055e6600c12efc783ef793b34b8d06646c40/images/page/home/customer-tabs/cincinnati-childrens-desktop.jpg' },
    { name: 'GoogleImageLG', url: 'https://ssl.gstatic.com/gb/images/p1_6269e604.png' },
    { name: 'YoutubeScript', url: 'https://www.youtube.com/yts/jsbin/desktop_polymer_inlined_html_polymer_flags_v2-vflGtoGN1/desktop_polymer_inlined_html_polymer_flags_v2.js' },
];

const allCalls = largeCalls.flatMap(x => [x, ...calls]);

const loop = async (i: number) => {
    console.log(`${new Date().toISOString()}`);

    const call = allCalls[i % allCalls.length];
    await tryFetch(call.name, call.url);
};

export const run = async (outDir: string) => {
    SETTINGS.outDir = path.resolve(outDir);

    let i = 0;
    setInterval(() => {
        try { loop(i++); } catch{ }
    }, TICK_TIME);
};

// run();