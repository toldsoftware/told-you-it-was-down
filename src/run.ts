import fetch from 'node-fetch';
import * as path from 'path';
import * as fsRaw from 'fs';
import * as util from 'util';
export const fs = {
    appendFile: util.promisify(fsRaw.appendFile),
};

const TIMEOUT = 5000;
const TIME_WARN = 500;
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
        const timeDeltaMs = getTimeSinceMs(timeStart);
        const message = `ms=${(timeDeltaMs + '').padStart(6, ' ')} \t${name} \t${url}`;

        if (!response.ok) {
            logError(`ERROR \t${message} \t${response.status} \t${response.statusText}`);
        } else if (timeDeltaMs > TIME_WARN) {
            logWarning(message);
        } else {
            logInfo(message);
        }
    } catch (err) {
        const message = `ms=${(timeout + '').padStart(6, ' ')} \t${name} \t${url}`;
        logError(message);
    }
};

const loop = async () => {

    console.log(`${new Date().toISOString()}`);
    const calls = [
        tryFetch('GoogleFavIcon', 'http://www.google.com/images/google_favicon_128.png'),
        tryFetch('Bing__FavIcon', 'http://www.bing.com/s/a/bing_p.ico'),
        tryFetch('WIFI__FavIcon', 'http://192.168.1.1/0.1/gui/images/faviconNone.ico'),
    ];

    await Promise.all(calls);
};

export const run = async (outDir: string) => {
    SETTINGS.outDir = path.resolve(outDir);

    setInterval(() => {
        try { loop(); } catch{ }
    }, TIMEOUT);
};

// run();