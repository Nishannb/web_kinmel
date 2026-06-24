/**
 * Viral live load test — 500 sellers, 50 concurrent lives, 10k comments on one stream.
 *
 * Usage:
 *   k6 run webhook-loadtest-viral.js \
 *     -e BASE_URL=http://localhost:8080 \
 *     -e VIRAL_COMMENTS=10000 \
 *     -e VIRAL_DURATION=30m \
 *     -e LIVE_SELLERS=50 \
 *     -e WEBHOOK_VERIFY_SIGNATURE=0
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const errors = new Counter('webhook_errors');
const successRate = new Rate('webhook_success_rate');
const ingressLatency = new Trend('webhook_ingress_ms');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const URL = `${BASE_URL}${__ENV.WEBHOOK_PATH || '/webhook'}`;

const VIRAL_COMMENTS = Number(__ENV.VIRAL_COMMENTS || 10000);
const VIRAL_DURATION = __ENV.VIRAL_DURATION || '30m';
const LIVE_SELLERS = Number(__ENV.LIVE_SELLERS || 50);
const OTHER_LIVE_RATE = Number(__ENV.OTHER_LIVE_RATE || 2); // comments/min per other live seller

// Viral seller: 10000 / 30min ≈ 5.56/s
const viralRate = VIRAL_COMMENTS / (30 * 60);
const otherRate = ((LIVE_SELLERS - 1) * OTHER_LIVE_RATE) / 60;
const totalRate = Math.ceil(viralRate + otherRate);

export const options = {
  discardResponseBodies: false,
  scenarios: {
    viral_live: {
      executor: 'constant-arrival-rate',
      rate: Math.max(1, Math.round(viralRate * 100) / 100),
      timeUnit: '1s',
      duration: VIRAL_DURATION,
      preAllocatedVUs: Number(__ENV.PRE_VUS || 50),
      maxVUs: Number(__ENV.MAX_VUS || 200),
      exec: 'viralComment',
    },
    other_live_sellers: {
      executor: 'constant-arrival-rate',
      rate: Math.max(0.1, Math.round(otherRate * 100) / 100),
      timeUnit: '1s',
      duration: VIRAL_DURATION,
      preAllocatedVUs: Number(__ENV.OTHER_PRE_VUS || 20),
      maxVUs: Number(__ENV.OTHER_MAX_VUS || 100),
      exec: 'otherLiveComment',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<100', 'p(99)<500'],
    webhook_success_rate: ['rate>0.99'],
    webhook_ingress_ms: ['p(95)<80'],
  },
};

function randomId(prefix) {
  return `${prefix}_${__VU}_${__ITER}_${Date.now()}`;
}

function liveCommentPayload(sellerId, matchLineup = false) {
  return JSON.stringify({
    object: 'instagram',
    entry: [
      {
        id: sellerId,
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: 'live_comments',
            value: {
              id: randomId('comment'),
              text: matchLineup ? '3' : 'hello from load test',
              from: {
                id: randomId('igsid'),
                username: `viewer_${Math.floor(Math.random() * 100000)}`,
                self_ig_scoped_id: randomId('igsid'),
              },
              media: {
                id: randomId('media'),
                media_product_type: 'LIVE',
              },
            },
          },
        ],
      },
    ],
  });
}

function postWebhook(payload) {
  const res = http.post(URL, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: '10s',
  });
  ingressLatency.add(res.timings.duration);
  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'body has ok': (r) => {
      try {
        const b = JSON.parse(r.body);
        return b.ok === true;
      } catch {
        return false;
      }
    },
  });
  successRate.add(ok);
  if (!ok) errors.add(1);
  return res;
}

export function viralComment() {
  // Seller 0 = viral stream; 50% match lineup call number "3"
  const match = Math.random() < 0.5;
  postWebhook(liveCommentPayload('17841400000000000', match));
  sleep(Math.random() * 0.02);
}

export function otherLiveComment() {
  const sellerNum = 1 + Math.floor(Math.random() * (LIVE_SELLERS - 1));
  const sellerId = `1784140000${String(sellerNum).padStart(6, '0')}`;
  postWebhook(liveCommentPayload(sellerId, false));
  sleep(Math.random() * 0.05);
}

export function handleSummary(data) {
  const rate = totalRate.toFixed(2);
  return {
    stdout: `\nViral load test complete.\n` +
      `  Target rate: ~${rate}/s (${viralRate.toFixed(2)} viral + ${otherRate.toFixed(2)} other)\n` +
      `  Viral comments: ${VIRAL_COMMENTS} over ${VIRAL_DURATION}\n` +
      `  Live sellers: ${LIVE_SELLERS}\n` +
      `  p95 ingress: ${data.metrics.webhook_ingress_ms?.values?.['p(95)'] || 'n/a'} ms\n`,
  };
}
