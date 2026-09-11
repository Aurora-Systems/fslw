import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner & Delivery API — FastLinQ',
  description:
    'Integrate FastLinQ deliveries into your ecommerce platform. Create a delivery, collect courier offers, assign one, track it live, and confirm with a delivery code — over a simple JSON API.',
};

const MAILTO =
  'mailto:hello@fastlinq.app?subject=FastLinQ%20API%20integration';

function Code({ lang, children }: { lang: string; children: string }) {
  return (
    <div className="doc-code">
      <div className="doc-code-lang">{lang}</div>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default function PartnerApiPage() {
  return (
    <>
      <section className="doc-hero">
        <div className="container">
          <div className="eyebrow" style={{ color: 'rgba(255,255,255,.85)' }}>
            Developers
          </div>
          <h1>Partner &amp; Delivery API</h1>
          <p>
            Book couriers straight from your own checkout. Create a delivery, collect offers from
            real drivers, assign one, watch it move on a map, and close it out with a delivery
            code — all over a simple JSON API.
          </p>
          <div className="dev-meta">
            <span className="dev-chip">
              Base URL <code>https://api.fastlinq.app</code>
            </span>
            <span className="dev-chip">
              Version <code>/api/v1</code>
            </span>
            <span className="dev-chip">Format JSON</span>
          </div>
        </div>
      </section>

      <section className="doc-body">
        <div className="container">
          <div className="doc-wrap">
            {/* Get integrated */}
            <div className="dev-cta">
              <div className="dev-cta-text">
                <h3>Want to integrate FastLinQ?</h3>
                <p>
                  Tell us about your platform and we’ll issue your API credentials. To get started,
                  email <strong>hello@fastlinq.app</strong>.
                </p>
              </div>
              <a className="btn-email" href={MAILTO}>
                Email hello@fastlinq.app
              </a>
            </div>

            {/* TOC */}
            <nav className="doc-toc" aria-label="On this page">
              <div className="doc-toc-title">On this page</div>
              <ol>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#auth">Authentication</a></li>
                <li><a href="#lifecycle">Delivery lifecycle</a></li>
                <li><a href="#quotes">Quote a delivery</a></li>
                <li><a href="#create">Create a delivery</a></li>
                <li><a href="#list">List deliveries</a></li>
                <li><a href="#get">Get a delivery</a></li>
                <li><a href="#offers">List offers</a></li>
                <li><a href="#accept">Accept an offer</a></li>
                <li><a href="#confirm">Confirm delivery</a></li>
                <li><a href="#cancel">Cancel a delivery</a></li>
                <li><a href="#vehicles">Vehicle types</a></li>
                <li><a href="#webhooks">Webhooks</a></li>
                <li><a href="#models">Data models</a></li>
                <li><a href="#errors">Errors</a></li>
                <li><a href="#practices">Best practices</a></li>
              </ol>
            </nav>

            {/* Overview */}
            <h2 id="overview">Overview</h2>
            <p>
              The FastLinQ API gives your ecommerce platform programmatic access to FastLinQ’s
              courier marketplace. It follows the same flow your customers see in the app: you post
              a delivery, nearby couriers offer to carry it, you pick one, and the parcel is tracked
              to the door.
            </p>
            <p>
              Every request and response is JSON. Send{' '}
              <code className="inline">Content-Type: application/json</code> on requests with a
              body. All endpoints live under <code className="inline">/api/v1</code>.
            </p>

            {/* Auth */}
            <h2 id="auth">Authentication</h2>
            <p>Pass your API key in the <code className="inline">x-api-key</code> header:</p>
            <Code lang="http">{`x-api-key: flq_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>
            <p>Or, equivalently, as a bearer token:</p>
            <Code lang="http">{`Authorization: Bearer flq_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>
            <p>
              Keys are issued by the FastLinQ team and shown <strong>only once</strong> at creation.
              Store yours securely, treat it like a password, and use it only from your server —
              never from a browser or mobile app. Each key carries one or more scopes:
            </p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr><th>Scope</th><th>Grants</th></tr>
                </thead>
                <tbody>
                  <tr><td><code className="inline">deliveries:read</code></td><td>Reading deliveries, offers, and vehicle types</td></tr>
                  <tr><td><code className="inline">deliveries:write</code></td><td>Creating deliveries, accepting offers, confirming, and cancelling</td></tr>
                </tbody>
              </table>
            </div>
            <p>
              A <code className="inline">401</code> means the key is missing, invalid, or revoked; a{' '}
              <code className="inline">403</code> means it lacks the scope for that call. Verify your
              key works:
            </p>
            <Code lang="curl">{`curl https://api.fastlinq.app/api/v1/ping -H "x-api-key: $FLQ_KEY"
# { "ok": true, "client": "Acme Store" }`}</Code>

            {/* Lifecycle */}
            <h2 id="lifecycle">Delivery lifecycle</h2>
            <p>FastLinQ is a marketplace — couriers bid for your delivery, and you choose.</p>
            <div className="dev-steps">
              <div className="dev-step"><span className="n">1</span><div><h4>Create</h4><p>Post a delivery with a recommended fee. Nearby couriers are notified instantly.</p></div></div>
              <div className="dev-step"><span className="n">2</span><div><h4>Collect offers</h4><p>Couriers submit offers — they may match your fee, raise it, or go up to 40% below. Get them pushed via webhook, or poll.</p></div></div>
              <div className="dev-step"><span className="n">3</span><div><h4>Accept</h4><p>Assign the offer you want. The courier must be online at that moment to be assigned.</p></div></div>
              <div className="dev-step"><span className="n">4</span><div><h4>Track</h4><p>Follow the delivery’s status and the courier’s live location.</p></div></div>
              <div className="dev-step"><span className="n">5</span><div><h4>Confirm</h4><p>Your recipient’s 6-character delivery code closes the job at hand-over.</p></div></div>
            </div>
            <p>You can cancel any time before completion. A delivery’s status is one of:</p>
            <div className="dev-pills">
              <span className="dev-pill pending">pending</span>
              <span className="dev-pill assigned">assigned</span>
              <span className="dev-pill completed">completed</span>
              <span className="dev-pill cancelled">cancelled</span>
            </div>

            {/* Quotes */}
            <section id="quotes">
              <h2>Quote a delivery</h2>
              <div className="endpoint">
                <div className="endpoint-head">
                  <span className="verb post">POST</span>
                  <span className="path">/api/v1/quotes</span>
                  <span className="scope">scope <b>deliveries:read</b></span>
                </div>
                <div className="endpoint-body">
                  <p>
                    Price a route <strong>without creating a delivery</strong> — use this to show a
                    shipping cost at checkout. Nothing is created and no couriers are notified.
                    Omit <code className="inline">vehicle_id</code> to get a quote for every vehicle type.
                  </p>
                  <Code lang="curl">{`curl -X POST https://api.fastlinq.app/api/v1/quotes \\
  -H "x-api-key: $FLQ_KEY" -H "Content-Type: application/json" \\
  -d '{
    "pickup":  { "formatted_address": "12 Samora Machel Ave, Harare", "lat": -17.8292, "lng": 31.0522 },
    "dropoff": { "formatted_address": "5 Borrowdale Rd, Harare",      "lat": -17.7600, "lng": 31.0900 }
  }'`}</Code>
                  <Code lang="json">{`{
  "distance": 6100,
  "distance_source": "road",
  "currency": "USD",
  "data": [
    { "vehicle_type": "Motorbike", "recommended_fee": 5.20, "minimum_fee": 3.12 },
    { "vehicle_type": "Van",       "recommended_fee": 8.50, "minimum_fee": 5.10 }
  ]
}`}</Code>
                  <p>
                    <code className="inline">distance_source</code> is <code className="inline">road</code> when a
                    routed distance was available, or <code className="inline">straight_line</code> as a fallback.
                    <code className="inline">minimum_fee</code> is the lowest a courier may be offered (40% below
                    recommended).
                  </p>
                </div>
              </div>
            </section>

            {/* Create */}
            <h2 id="create">Create a delivery</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb post">POST</span>
                <span className="path">/api/v1/deliveries</span>
                <span className="scope">scope <b>deliveries:write</b></span>
              </div>
              <div className="endpoint-body">
                <p>Post a new delivery request. The response includes the delivery code you hand to your recipient.</p>
                <div className="doc-table-wrap">
                  <table className="doc-table">
                    <thead><tr><th>Field</th><th>Type</th><th>Req</th><th>Notes</th></tr></thead>
                    <tbody>
                      <tr><td><code className="inline">pickup</code></td><td>Location</td><td><span className="req">yes</span></td><td>Where the parcel is collected</td></tr>
                      <tr><td><code className="inline">dropoff</code></td><td>Location</td><td><span className="req">yes</span></td><td>Where it is delivered</td></tr>
                      <tr><td><code className="inline">vehicle_id</code></td><td>string</td><td><span className="req">yes</span></td><td>A vehicle type id from <a href="#vehicles">vehicle types</a></td></tr>
                      <tr><td><code className="inline">recommended_fee</code></td><td>number</td><td><span className="req">yes</span></td><td>Suggested price (USD); couriers may match or raise</td></tr>
                      <tr><td><code className="inline">recipient</code></td><td>Recipient</td><td><span className="req">yes</span></td><td>{'{ name, phone }'} of the person receiving it</td></tr>
                      <tr><td><code className="inline">content_description</code></td><td>string</td><td><span className="req">yes</span></td><td>What is being sent</td></tr>
                      <tr><td><code className="inline">estimated_mass</code></td><td>number</td><td><span className="opt">no</span></td><td>Kilograms</td></tr>
                      <tr><td><code className="inline">distance</code></td><td>number</td><td><span className="opt">no</span></td><td>Metres; a straight-line estimate is used if omitted</td></tr>
                      <tr><td><code className="inline">dangerous_contents</code></td><td>boolean</td><td><span className="opt">no</span></td><td>Default false</td></tr>
                      <tr><td><code className="inline">payment_terms</code></td><td>string</td><td><span className="opt">no</span></td><td>Free text, e.g. on_delivery</td></tr>
                      <tr><td><code className="inline">pickup_date</code></td><td>number</td><td><span className="opt">no</span></td><td>Epoch milliseconds</td></tr>
                      <tr><td><code className="inline">delivery_date</code></td><td>number</td><td><span className="opt">no</span></td><td>Epoch milliseconds</td></tr>
                      <tr><td><code className="inline">external_ref</code></td><td>string</td><td><span className="opt">no</span></td><td>Your own order reference, echoed on every read</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="dev-table-note">
                  Location is <code className="inline">{'{ formatted_address, lat, lng }'}</code>. Recipient is <code className="inline">{'{ name, phone }'}</code>.
                </p>
                <Code lang="curl">{`curl -X POST https://api.fastlinq.app/api/v1/deliveries \\
  -H "x-api-key: $FLQ_KEY" -H "Content-Type: application/json" \\
  -d '{
    "pickup":  { "formatted_address": "12 Samora Machel Ave, Harare", "lat": -17.8292, "lng": 31.0522 },
    "dropoff": { "formatted_address": "5 Borrowdale Rd, Harare",      "lat": -17.7600, "lng": 31.0900 },
    "vehicle_id": "b1f2c3d4",
    "recommended_fee": 8.50,
    "recipient": { "name": "Jane Doe", "phone": "+263771234567" },
    "content_description": "Documents envelope",
    "external_ref": "ORDER-4821"
  }'`}</Code>
                <p><code className="inline">201 Created</code> returns the <a href="#models">Delivery</a> object, including the delivery code:</p>
                <Code lang="json">{`{
  "id": 1234,
  "external_ref": "ORDER-4821",
  "status": "pending",
  "recipient": { "name": "Jane Doe", "phone": "+263771234567" },
  "vehicle_id": "b1f2c3d4",
  "delivery_fee": 8.5,
  "delivery_code": "K7P3QX",
  "distance": 6100,
  "carrier": null,
  "current_location": null,
  "created_at": "2026-08-24T10:31:00.000Z"
}`}</Code>
              </div>
            </div>

            {/* List */}
            <h2 id="list">List your deliveries</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb get">GET</span>
                <span className="path">/api/v1/deliveries</span>
                <span className="scope">scope <b>deliveries:read</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  Paginated list of your deliveries, newest first. Query params:{' '}
                  <code className="inline">page</code> (default 1),{' '}
                  <code className="inline">limit</code> (default 20, max 100),{' '}
                  <code className="inline">status</code>, <code className="inline">external_ref</code>.
                </p>
                <Code lang="json">{`{
  "data": [ /* Delivery objects */ ],
  "meta": { "total": 42, "page": 1, "limit": 20, "pages": 3 }
}`}</Code>
              </div>
            </div>

            {/* Get */}
            <h2 id="get">Get a delivery</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb get">GET</span>
                <span className="path">/api/v1/deliveries/:id</span>
                <span className="scope">scope <b>deliveries:read</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  Fetch one delivery: status, the assigned <code className="inline">carrier</code>,
                  and their <code className="inline">current_location</code> while in transit.
                </p>
                <Code lang="json">{`{
  "id": 1234,
  "status": "assigned",
  "carrier": {
    "user_id": "8ac1...",
    "name": "John M",
    "contact_number": "+263770000000",
    "vehicle": { "brand": "Toyota", "model": "Hiace", "vrn": "ABC1234" }
  },
  "current_location": { "lat": -17.8005, "lng": 31.0701, "updated_at": 1756031999000 },
  "delivery_code": "K7P3QX"
}`}</Code>
                <p>
                  <code className="inline">current_location</code> is null until the courier starts
                  moving, and may be null if no update arrived in the last few minutes.
                </p>
              </div>
            </div>

            {/* Offers */}
            <h2 id="offers">List offers</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb get">GET</span>
                <span className="path">/api/v1/deliveries/:id/offers</span>
                <span className="scope">scope <b>deliveries:read</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  While a delivery is <code className="inline">pending</code>, poll this to see
                  courier offers (cheapest first). Returns an empty list once a courier is assigned.
                </p>
                <Code lang="json">{`{
  "data": [
    {
      "transporter_user_id": "8ac1...",
      "offer_amount": 9.00,
      "distance_to_pickup": { "text": "1.2 km", "value": 1200 },
      "created_at": 1756031000000,
      "carrier": { "name": "John M", "vehicle": { } }
    }
  ]
}`}</Code>
                <p>
                  Pass the <code className="inline">transporter_user_id</code> of the offer you like
                  to the accept endpoint. Poll every ~3–5 seconds while waiting.
                </p>
              </div>
            </div>

            {/* Accept */}
            <h2 id="accept">Accept an offer</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb post">POST</span>
                <span className="path">/api/v1/deliveries/:id/accept</span>
                <span className="scope">scope <b>deliveries:write</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  Assign the delivery to a courier. Body:{' '}
                  <code className="inline">{'{ "transporter_user_id": "..." }'}</code>.
                </p>
                <Code lang="curl">{`curl -X POST https://api.fastlinq.app/api/v1/deliveries/1234/accept \\
  -H "x-api-key: $FLQ_KEY" -H "Content-Type: application/json" \\
  -d '{ "transporter_user_id": "8ac1..." }'`}</Code>
                <p><code className="inline">200 OK</code> returns the updated delivery, now assigned.</p>
                <div className="doc-note">
                  <p>
                    <strong>Couriers must be online to accept.</strong> A{' '}
                    <code className="inline">409</code> with “Carrier is offline” means the courier
                    went offline after offering — pick another offer. A{' '}
                    <code className="inline">409</code> can also mean the delivery was already
                    assigned; a <code className="inline">404</code> means the offer is no longer
                    available.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirm */}
            <h2 id="confirm">Confirm delivery</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb post">POST</span>
                <span className="path">/api/v1/deliveries/:id/confirm-delivery</span>
                <span className="scope">scope <b>deliveries:write</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  At hand-over, submit the 6-character delivery code your recipient was given. This
                  marks the delivery completed. Idempotent — confirming an already-completed
                  delivery still returns success.
                </p>
                <Code lang="curl">{`curl -X POST https://api.fastlinq.app/api/v1/deliveries/1234/confirm-delivery \\
  -H "x-api-key: $FLQ_KEY" -H "Content-Type: application/json" \\
  -d '{ "code": "K7P3QX" }'
# { "message": "Delivery confirmed" }`}</Code>
                <p>A <code className="inline">400</code> is returned if the code is wrong.</p>
              </div>
            </div>

            {/* Cancel */}
            <h2 id="cancel">Cancel a delivery</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb post">POST</span>
                <span className="path">/api/v1/deliveries/:id/cancel</span>
                <span className="scope">scope <b>deliveries:write</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  Cancel before completion. Optional body:{' '}
                  <code className="inline">{'{ "reason": "customer changed their mind" }'}</code>.
                  Returns <code className="inline">409</code> if already completed.
                </p>
                <Code lang="json">{`{ "message": "Delivery cancelled" }`}</Code>
              </div>
            </div>

            {/* Vehicle types */}
            <h2 id="vehicles">Vehicle types</h2>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb get">GET</span>
                <span className="path">/api/v1/vehicle-types</span>
                <span className="scope">scope <b>deliveries:read</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  Use a <code className="inline">vehicle_id</code> from here when creating a
                  delivery. <code className="inline">base_fare</code> and{' '}
                  <code className="inline">charge_per_km</code> help you compute a sensible{' '}
                  <code className="inline">recommended_fee</code>.
                </p>
                <Code lang="json">{`{
  "data": [
    {
      "vehicle_id": "b1f2c3d4",
      "vehicle_type": "Van",
      "description": "Up to 1 tonne",
      "charge_per_km": 0.65,
      "base_fare": 3.00,
      "max_load": 1000
    }
  ]
}`}</Code>
              </div>
            </div>

            {/* Models */}
            <h2 id="models">Data models</h2>
            <h3>Delivery</h3>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead><tr><th>Field</th><th>Type</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td><code className="inline">id</code></td><td>number</td><td>FastLinQ delivery id</td></tr>
                  <tr><td><code className="inline">external_ref</code></td><td>string | null</td><td>Your order reference</td></tr>
                  <tr><td><code className="inline">status</code></td><td>string</td><td>pending · assigned · completed · cancelled</td></tr>
                  <tr><td><code className="inline">recipient</code></td><td>object</td><td><code className="inline">{'{ name, phone }'}</code></td></tr>
                  <tr><td><code className="inline">pickup</code> / <code className="inline">dropoff</code></td><td>Location</td><td><code className="inline">{'{ formatted_address, lat, lng }'}</code></td></tr>
                  <tr><td><code className="inline">vehicle_id</code></td><td>string</td><td>Vehicle type</td></tr>
                  <tr><td><code className="inline">delivery_fee</code></td><td>number</td><td>Agreed (or recommended, until accepted) fee, USD</td></tr>
                  <tr><td><code className="inline">delivery_code</code></td><td>string</td><td>6 chars — give to your recipient</td></tr>
                  <tr><td><code className="inline">distance</code></td><td>number</td><td>Metres</td></tr>
                  <tr><td><code className="inline">carrier</code></td><td>object | null</td><td>Assigned courier and vehicle</td></tr>
                  <tr><td><code className="inline">current_location</code></td><td>object | null</td><td><code className="inline">{'{ lat, lng, updated_at }'}</code> — epoch ms</td></tr>
                  <tr><td><code className="inline">created_at</code></td><td>string</td><td>ISO 8601</td></tr>
                  <tr><td><code className="inline">delivered_on</code></td><td>number | null</td><td>Epoch ms when completed</td></tr>
                </tbody>
              </table>
            </div>
            <h3>Offer</h3>
            <p>
              <code className="inline">transporter_user_id</code>,{' '}
              <code className="inline">offer_amount</code>,{' '}
              <code className="inline">vehicle_id</code>,{' '}
              <code className="inline">carrier_vehicle</code>,{' '}
              <code className="inline">distance_to_pickup</code> ({'{ text, value }'}),{' '}
              <code className="inline">created_at</code>, and{' '}
              <code className="inline">carrier</code> ({'{ name, photo_id, vehicle }'}).
            </p>

            {/* Errors */}
            <h2 id="errors">Errors</h2>
            <p>
              All errors return a JSON body. Validation failures on create may add a{' '}
              <code className="inline">details</code> array.
            </p>
            <Code lang="json">{`{ "error": "human-readable message" }`}</Code>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead><tr><th>Status</th><th>Meaning</th></tr></thead>
                <tbody>
                  <tr><td><code className="inline">400</code></td><td>Bad request / validation error</td></tr>
                  <tr><td><code className="inline">401</code></td><td>Missing, invalid, or revoked API key</td></tr>
                  <tr><td><code className="inline">403</code></td><td>Key lacks the required scope</td></tr>
                  <tr><td><code className="inline">404</code></td><td>Delivery or offer not found</td></tr>
                  <tr><td><code className="inline">409</code></td><td>Conflict — offline courier, already assigned, or already completed</td></tr>
                  <tr><td><code className="inline">500</code></td><td>Server error</td></tr>
                </tbody>
              </table>
            </div>

            {/* Best practices */}
            <h2 id="practices">Best practices</h2>
            <ul>
              <li><strong>Keep your API key server-side.</strong> If a key is ever exposed, ask us to revoke and reissue it.</li>
              <li><strong>Poll offers</strong> every few seconds while a delivery is pending; stop once you accept or the list is empty and a carrier is set.</li>
              <li><strong>Handle the offline case.</strong> A courier must be online to be assigned — if accept returns 409 “Carrier is offline”, accept a different offer.</li>
              <li><strong>The delivery code is a shared secret</strong> between you and your recipient. Deliver it to the recipient only; hand-over completes when the code is accepted.</li>
              <li><strong>Units:</strong> amounts are USD, distances are metres, and timestamps on current_location and delivered_on are epoch milliseconds while created_at is ISO 8601.</li>
            </ul>

            {/* Closing CTA */}
            <div className="dev-cta" style={{ marginTop: '40px' }}>
              <div className="dev-cta-text">
                <h3>Ready to integrate?</h3>
                <p>Email <strong>hello@fastlinq.app</strong> and we’ll set you up with API credentials.</p>
              </div>
              <a className="btn-email" href={MAILTO}>
                Email hello@fastlinq.app
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
