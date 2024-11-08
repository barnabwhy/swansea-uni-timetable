import { Injectable, NestMiddleware } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'node:path';
import { log } from './common/log';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const UIDS_SEEN = new Map<string, number>();

interface UsageMetrics {
    users: {
        hourly: number;
        daily: number;
    };
    requests: {
        hourly: number;
        daily: number;
    }
}

const HOURLY_REQUEST_COUNTER: number[] = Array(24).fill(0);

@Injectable()
export class AnalyticsMiddleware implements NestMiddleware {
    async use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
        if (req.method == 'OPTIONS') {
            next();
            return;
        }

        let uid = req.headers['uid'];
        if (uid && typeof uid == 'string') {
            // Hash UID so it can't be easily traced back to a user
            let uidHashedBuf = createHash('sha256').update(uid, 'utf8').digest();
            const decoder = new TextDecoder();
            const uidHashed = decoder.decode(uidHashedBuf);

            // Store time of most recent request by user
            UIDS_SEEN.set(uidHashed, Date.now());
        }

        HOURLY_REQUEST_COUNTER[23] += 1;

        next();
    }
}

let logCount = 0;
setInterval(() => {
    logMetrics();
    logCount++;
    if (logCount % 24 == 0) {
        rotateMetricsFile();
    }
}, 60 * 60 * 1000); // log every hour

const METRICS_LOG_PATH = process.env.METRICS_LOG_PATH ?? path.resolve(process.cwd(), "../metrics/");
let metricsFileTimestamp = Date.now();

function logMetrics() {
    log("METRICS", "Saving metrics.");

    if (!existsSync(METRICS_LOG_PATH)) {
        mkdirSync(METRICS_LOG_PATH, { recursive: true });
    }

    let metricsFilePath = path.resolve(METRICS_LOG_PATH, `./${metricsFileTimestamp}.json`);

    let lastHourUIDs = UIDS_SEEN.entries().toArray().filter(([_, lastReq]) => lastReq >= (Date.now() - 60*60*1000)).length;
    let lastDayUIDs = UIDS_SEEN.entries().toArray().filter(([_, lastReq]) => lastReq >= (Date.now() - 24*60*60*1000)).length;

    let metrics: UsageMetrics = {
        users: {
            hourly: lastHourUIDs,
            daily: lastDayUIDs,
        },
        requests: {
            hourly: HOURLY_REQUEST_COUNTER[23],
            daily: HOURLY_REQUEST_COUNTER.reduce((a,b)=>a+b),
        },
    };

    writeFileSync(metricsFilePath, JSON.stringify(metrics));

    HOURLY_REQUEST_COUNTER.shift();
    HOURLY_REQUEST_COUNTER.push(0);
}

function rotateMetricsFile() {
    metricsFileTimestamp = Date.now();
}

process.on("SIGINT", async () => {
    console.log("Ctrl-C was pressed");
    logMetrics();
    process.exit();
});
