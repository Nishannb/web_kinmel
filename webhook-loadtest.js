import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const errors = new Counter('webhook_errors');
const successRate = new Rate('webhook_success_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WEBHOOK_PATH = __ENV.WEBHOOK_PATH || '/webhook';
const URL = `${BASE_URL}${WEBHOOK_PATH}`;

const INGRESS_P95_MS = Number(__ENV.INGRESS_P95_MS || 400);
const INGRESS_P99_MS = Number(__ENV.INGRESS_P99_MS || 1000);

export const options = {
  discardResponseBodies: true,
  scenarios: {
    // Main sustained traffic profile (webhooks/sec)
    webhook_stream: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RATE || 30), // events per second
      timeUnit: '1s',
      duration: __ENV.DURATION || '5m',
      preAllocatedVUs: Number(__ENV.PRE_VUS || 40),
      maxVUs: Number(__ENV.MAX_VUS || 300),
    },
  },
  thresholds: {
    // Async ingress (WEBHOOK_ASYNC=1): set INGRESS_P95_MS=50
    http_req_failed: ['rate<0.01'],
    http_req_duration: [`p(95)<${INGRESS_P95_MS}`, `p(99)<${INGRESS_P99_MS}`],
    webhook_success_rate: ['rate>0.99'],
  },
};

function randomId(prefix) {
  return `${prefix}_${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * 1e9)}`;
}

function commentPayload(type = 'comments') {
  const isLive = type === 'live_comments';
  const mediaType = isLive ? 'LIVE' : (Math.random() < 0.5 ? 'FEED' : 'REELS');

  return JSON.stringify({
    object: 'instagram',
    entry: [
      {
        id: '17841400000000000', // app user's IG account id
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: type,
            value: {
              id: randomId('comment'),
              text: Math.random() < 0.6 ? 'loadtest-no-match' : 'hello there',
              from: {
                id: randomId('igsid'),
                username: `user_${Math.floor(Math.random() * 100000)}`,
                self_ig_scoped_id: randomId('igsid'),
              },
              media: {
                id: randomId('media'),
                media_product_type: mediaType,
              },
            },
          },
        ],
      },
    ],
  });
}

export default function () {
  // Mix: 70% post/reel comments, 30% live comments
  const payload = Math.random() < 0.7 ? commentPayload('comments') : commentPayload('live_comments');

  const res = http.post(URL, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  });

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
  });

  successRate.add(ok);
  if (!ok) errors.add(1);

  // Tiny jitter keeps timing realistic
  sleep(Math.random() * 0.05);
}

