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
                <li><a href="#sandbox">Testing with the sandbox</a></li>
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
              Live keys start with <code className="inline">flq_live_</code> and act on real
              deliveries. Test keys start with <code className="inline">flq_test_</code> and work
              against the same base URL and endpoints, but only on simulated deliveries that never
              reach a real courier. See <a href="#sandbox">Testing with the sandbox</a>.
            </p>
            <p>
              A <code className="inline">401</code> means the key is missing, invalid, or revoked; a{' '}
              <code className="inline">403</code> means it lacks the scope for that call. Verify your
              key works:
            </p>
            <Code lang="curl">{`curl https://api.fastlinq.app/api/v1/ping -H "x-api-key: $FLQ_KEY"
# { "ok": true, "client": "Acme Store", "mode": "live" }`}</Code>

            {/* Sandbox */}
            <h2 id="sandbox">Testing with the sandbox</h2>
            <p>
              Build and test your whole integration without booking a real courier. Ask us for a
              test key alongside your live key. It uses the same base URL,{' '}
              <code className="inline">https://api.fastlinq.app</code>, and the same endpoints and
              request bodies. The key itself decides the mode:
            </p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead><tr><th>Mode</th><th>Key prefix</th><th>Acts on</th></tr></thead>
                <tbody>
                  <tr><td><code className="inline">live</code></td><td><code className="inline">flq_live_…</code></td><td>Real deliveries, real couriers</td></tr>
                  <tr><td><code className="inline">test</code></td><td><code className="inline">flq_test_…</code></td><td>Simulated deliveries in the sandbox</td></tr>
                </tbody>
              </table>
            </div>
            <ul>
              <li><strong>Nothing real happens.</strong> Test deliveries never reach real drivers, send no push notifications, and charge nothing.</li>
              <li><strong>Quotes and vehicle types are real.</strong> <code className="inline">/quotes</code> and <code className="inline">/vehicle-types</code> return live data, so the prices and <code className="inline">vehicle_id</code> values you test with are the ones you’ll use.</li>
              <li><strong>The two modes don’t mix.</strong> A test key only sees your sandbox deliveries, and a live key never sees them. Sandbox delivery ids start at <code className="inline">900000001</code>.</li>
              <li><strong>Everything else behaves like live.</strong> Create, list, get, offers, accept, confirm-delivery, and cancel return responses and errors with the same shapes and HTTP status codes, including the same <code className="inline">status</code> and <code className="inline">raw_status</code> values. Some validation messages differ: for an unknown <code className="inline">vehicle_id</code>, both return <code className="inline">400</code>, but the sandbox gives its own message, “Unknown vehicle_id. GET /api/v1/vehicle-types lists the valid values.”</li>
              <li><strong>Sandbox deliveries are hidden and deleted after 30 days.</strong></li>
            </ul>
            <p>
              Every response from an <code className="inline">/api/v1</code> endpoint to a request
              that includes a key carries an <code className="inline">X-FastLinQ-Mode</code> header
              set to <code className="inline">live</code> or <code className="inline">test</code>,
              taken from the key’s prefix. Errors such as <code className="inline">401</code> and{' '}
              <code className="inline">403</code> carry it too, so you can tell which mode
              answered. It is not sent on a <code className="inline">404</code> or{' '}
              <code className="inline">405</code> for an unknown path or a wrong method, or when no
              key is sent. Ping reports the mode as well:
            </p>
            <Code lang="curl">{`curl -i https://api.fastlinq.app/api/v1/ping -H "x-api-key: $FLQ_TEST_KEY"
# X-FastLinQ-Mode: test
# { "ok": true, "client": "Acme Store", "mode": "test" }`}</Code>

            <h3>Simulated drivers</h3>
            <p>
              Every test delivery receives offers from three simulated drivers, timed from when you
              create it and priced as a multiple of your{' '}
              <code className="inline">recommended_fee</code>. Poll <a href="#offers">List offers</a>{' '}
              or listen for <code className="inline">offer.received</code>, then accept one as you
              would live.
            </p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead><tr><th>Driver</th><th>transporter_user_id</th><th>Offer</th><th>Arrives</th><th>Away</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr><td>Sandbox Driver 1</td><td><code className="inline">00000000-0000-4000-a000-000000000001</code></td><td>0.9× fee</td><td>~3 s</td><td>1.4 km</td><td>Cheapest. Accepting succeeds.</td></tr>
                  <tr><td>Sandbox Driver 2</td><td><code className="inline">00000000-0000-4000-a000-000000000002</code></td><td>1.0× fee</td><td>~8 s</td><td>2.6 km</td><td>Matches your fee. Accepting succeeds.</td></tr>
                  <tr><td>Sandbox Driver 3 (offline)</td><td><code className="inline">00000000-0000-4000-a000-000000000003</code></td><td>1.15× fee</td><td>~15 s</td><td>5.2 km</td><td>Always offline: accepting returns <code className="inline">409</code> “Carrier is offline. A carrier must be online to accept the delivery.” Use it to test that error.</td></tr>
                </tbody>
              </table>
            </div>
            <p className="dev-table-note">
              Offers have the live <a href="#models">Offer</a> shape, with “Away” as{' '}
              <code className="inline">distance_to_pickup</code>, e.g.{' '}
              <code className="inline">{'{ "text": "1.4 km", "value": 1400 }'}</code>. As live,
              offers never go below 0.6× the recommended fee, none arrive once the delivery is
              assigned or cancelled, and they disappear 6 hours after the latest one arrived.
            </p>
            <Code lang="curl">{`# Create a test delivery: same body as a live one
curl -X POST https://api.fastlinq.app/api/v1/deliveries \\
  -H "x-api-key: $FLQ_TEST_KEY" -H "Content-Type: application/json" \\
  -d @delivery.json
# { "id": 900000001, "status": "pending", ... }

# A few seconds later, accept Sandbox Driver 1
curl -X POST https://api.fastlinq.app/api/v1/deliveries/900000001/accept \\
  -H "x-api-key: $FLQ_TEST_KEY" -H "Content-Type: application/json" \\
  -d '{ "transporter_user_id": "00000000-0000-4000-a000-000000000001" }'
# { "id": 900000001, "status": "assigned", "raw_status": "in-progress", ... }`}</Code>

            <h3>Simulated location</h3>
            <p>
              Once you accept an offer, <a href="#get">Get a delivery</a> reports the simulated
              driver’s <code className="inline">current_location</code> the way the live driver app
              does:
            </p>
            <ul>
              <li><strong>Null for about 20 seconds after accept.</strong> Live, it stays null until the driver app sends its first position.</li>
              <li><strong>Then updated every 5 seconds.</strong> <code className="inline">updated_at</code> moves in 5-second steps.</li>
              <li><strong>To the pickup, then the drop-off.</strong> The driver heads to the pickup over about 5 minutes and waits there. After the pickup step (see below) it moves in a straight line to the drop-off over about 10 minutes.</li>
              <li><strong>After completion,</strong> <code className="inline">current_location</code> shows the drop-off point for 10 minutes, with <code className="inline">updated_at</code> equal to <code className="inline">delivered_on</code>, then becomes null. After a cancel it is null.</li>
            </ul>
            <p>
              The driver never picks up or delivers on its own: you move each step with the advance
              endpoint.
            </p>

            <h3 id="sandbox-advance">Advance a test delivery</h3>
            <div className="endpoint">
              <div className="endpoint-head">
                <span className="verb post">POST</span>
                <span className="path">/api/v1/sandbox/deliveries/:id/advance</span>
                <span className="scope">scope <b>deliveries:write</b></span>
              </div>
              <div className="endpoint-body">
                <p>
                  Does what the driver would do next and returns the updated{' '}
                  <a href="#models">Delivery</a> object. No body. The scope is checked first: a key
                  without <code className="inline">deliveries:write</code> gets{' '}
                  <code className="inline">403</code> “Missing required scope: deliveries:write”.
                  Then it needs a test key: a live key gets <code className="inline">403</code>{' '}
                  “Sandbox endpoints only work with a test key (flq_test_...)”.
                </p>
                <Code lang="curl">{`curl -X POST https://api.fastlinq.app/api/v1/sandbox/deliveries/900000001/advance \\
  -H "x-api-key: $FLQ_TEST_KEY"
# { "id": 900000001, "status": "assigned", "raw_status": "in-progress", "carrier": { "name": "Sandbox Driver 1", ... }, ... }`}</Code>
                <div className="doc-table-wrap">
                  <table className="doc-table">
                    <thead><tr><th>Call</th><th>Step</th><th>status after</th><th>What happens</th></tr></thead>
                    <tbody>
                      <tr><td>1st</td><td>Picked up</td><td><code className="inline">assigned</code> (unchanged)</td><td>No status change: live doesn’t record a pickup either, so <code className="inline">raw_status</code> stays <code className="inline">in-progress</code>. <code className="inline">current_location</code> starts moving to the drop-off.</td></tr>
                      <tr><td>2nd</td><td>Delivered</td><td><code className="inline">completed</code></td><td>As when the driver enters the delivery code. Sets <code className="inline">delivered_on</code> and fires <code className="inline">delivery.completed</code>.</td></tr>
                    </tbody>
                  </table>
                </div>
                <p>
                  Before an offer is accepted it returns <code className="inline">409</code> “Accept
                  an offer first: nobody is driving this delivery yet”. On a completed or cancelled
                  delivery it returns <code className="inline">409</code> “Delivery is already
                  closed”. If two advance calls race, one of them returns{' '}
                  <code className="inline">409</code> “The delivery changed while advancing. Fetch it
                  and try again.” You can also complete a test delivery with{' '}
                  <a href="#confirm">confirm-delivery</a> and its delivery code, exactly as live.
                </p>
              </div>
            </div>

            <h3 id="sandbox-webhooks">Sandbox webhooks</h3>
            <p>
              Test deliveries fire the same <a href="#webhooks">webhook events</a> as live, with the
              same envelope and data:{' '}
              <code className="inline">offer.received</code>,{' '}
              <code className="inline">delivery.assigned</code>,{' '}
              <code className="inline">delivery.completed</code>, and{' '}
              <code className="inline">delivery.cancelled</code>. They go only to your separate
              sandbox webhook URL, signed with its own secret, and add an{' '}
              <code className="inline">X-FastLinQ-Mode: test</code> header. Your live webhook never
              receives a test event, and your sandbox webhook never receives a live one.
            </p>
            <Code lang="http">{`POST /your/sandbox/webhook
Content-Type: application/json
X-FastLinQ-Event: offer.received
X-FastLinQ-Mode: test
X-FastLinQ-Signature: sha256=<HMAC-SHA256 hex of the raw body>`}</Code>
            <p>
              Ask us to set your sandbox webhook URL (https only) and we’ll send you its signing
              secret. <a href="#webhook-verify">Verify</a>{' '}
              <code className="inline">X-FastLinQ-Signature</code> with the sandbox secret, not your
              live one.
            </p>

            <h3>Going live</h3>
            <ul>
              <li><strong>Swap the key.</strong> Replace your <code className="inline">flq_test_</code> key with your <code className="inline">flq_live_</code> key. Requests stay the same, and <code className="inline">X-FastLinQ-Mode</code> should now read <code className="inline">live</code>.</li>
              <li><strong>Set your live webhook.</strong> Ask us to set your live webhook URL, and verify signatures with its own signing secret.</li>
              <li><strong>Remove any advance calls.</strong> <a href="#sandbox-advance">Advance</a> returns <code className="inline">403</code> with a live key. Real deliveries move as the courier drives, and complete when the delivery code is entered, by you or by the courier.</li>
              <li><strong>Drop sandbox ids.</strong> Simulated driver ids and sandbox delivery ids (from <code className="inline">900000001</code>) don’t exist in live mode.</li>
            </ul>

            {/* Lifecycle */}
            <h2 id="lifecycle">Delivery lifecycle</h2>
            <p>FastLinQ is a marketplace — couriers bid for your delivery, and you choose.</p>
            <div className="dev-steps">
              <div className="dev-step"><span className="n">1</span><div><h4>Create</h4><p>Post a delivery with a recommended fee. Nearby couriers are notified instantly.</p></div></div>
              <div className="dev-step"><span className="n">2</span><div><h4>Collect offers</h4><p>Couriers submit offers: they may match your fee, raise it, or go up to 40% below. Get them pushed via <a href="#webhooks">webhook</a>, or poll.</p></div></div>
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
            <p>
              Each delivery also has a <code className="inline">raw_status</code>, the value
              FastLinQ stores: <code className="inline">pending</code>,{' '}
              <code className="inline">in-progress</code>, <code className="inline">completed</code>,
              or <code className="inline">cancelled</code>. Once you accept an offer it is{' '}
              <code className="inline">in-progress</code> (that is what the courier’s app runs),
              shown to you as <code className="inline">assigned</code>. Picking up the parcel
              doesn’t change either value. Both become <code className="inline">completed</code> when
              the delivery code is entered, by you with <a href="#confirm">confirm-delivery</a> or
              by the courier in the app.
            </p>

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
                <p>
                  <code className="inline">status</code> filters on the stored value (
                  <code className="inline">raw_status</code>), so it takes{' '}
                  <code className="inline">pending</code>, <code className="inline">in-progress</code>,{' '}
                  <code className="inline">completed</code>, or{' '}
                  <code className="inline">cancelled</code>. To list assigned deliveries, use{' '}
                  <code className="inline">status=in-progress</code>. Any other value, including{' '}
                  <code className="inline">assigned</code>, returns <code className="inline">400</code>:
                </p>
                <Code lang="curl">{`curl "https://api.fastlinq.app/api/v1/deliveries?status=in-progress" -H "x-api-key: $FLQ_KEY"

curl "https://api.fastlinq.app/api/v1/deliveries?status=assigned" -H "x-api-key: $FLQ_KEY"
# 400 { "error": "invalid input value for enum status: \\"assigned\\"" }`}</Code>
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
  "raw_status": "in-progress",
  "carrier": {
    "user_id": "8ac1...",
    "name": "John M",
    "contact_number": "+263770000000",
    "vehicle": { "brand": "Toyota", "model": "Hiace", "vrn": "ABC1234" }
  },
  "current_location": { "lat": -17.8005, "lng": 31.0701, "updated_at": 1787568495000 },
  "delivery_code": "K7P3QX"
}`}</Code>
                <p>
                  <code className="inline">current_location</code> is null until the courier’s app
                  sends its first position after accepting. Its{' '}
                  <code className="inline">updated_at</code> (epoch ms) tells you how fresh it is. The
                  last position is kept for 10 minutes after updates stop, so it is still shown for a
                  while after completion, then becomes null.
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
                  Offers disappear 6 hours after the latest one arrived.
                </p>
                <Code lang="json">{`{
  "data": [
    {
      "transporter_user_id": "8ac1...",
      "offer_amount": 9.00,
      "vehicle_id": "b1f2c3d4",
      "carrier_vehicle": 412,
      "distance_to_pickup": { "text": "1.2 km", "value": 1200 },
      "created_at": 1787567469000,
      "carrier": { "name": "John M", "photo_id": "...", "vehicle": { } }
    }
  ]
}`}</Code>
                <p>
                  Pass the <code className="inline">transporter_user_id</code> of the offer you like
                  to the accept endpoint. Poll every ~3–5 seconds while waiting, or listen for the{' '}
                  <a href="#webhooks"><code className="inline">offer.received</code></a> webhook.
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
                <p>
                  <code className="inline">200 OK</code> returns the updated delivery with{' '}
                  <code className="inline">status</code> <code className="inline">assigned</code> and{' '}
                  <code className="inline">raw_status</code> <code className="inline">in-progress</code>,
                  and fires <a href="#webhooks"><code className="inline">delivery.assigned</code></a>.
                  It stays <code className="inline">assigned</code> until it is completed or
                  cancelled.
                </p>
                <div className="doc-note">
                  <p>
                    <strong>Couriers must be online to accept.</strong> A{' '}
                    <code className="inline">409</code> with “Carrier is offline” means the courier
                    went offline after offering — pick another offer. A{' '}
                    <code className="inline">409</code> “Delivery already assigned to a carrier”
                    means another courier was assigned first, and{' '}
                    <code className="inline">409</code> “Delivery is already closed” means it was
                    cancelled or completed, even while you were accepting. A{' '}
                    <code className="inline">404</code> means the offer is no longer available.
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
                <p>
                  A <code className="inline">400</code> is returned if the code is wrong. A cancelled
                  delivery can’t be completed, by you or by the courier: confirming one returns{' '}
                  <code className="inline">409</code> “Delivery was cancelled”. Completing
                  fires <a href="#webhooks"><code className="inline">delivery.completed</code></a>,
                  which also fires when the courier enters the code in the app instead.
                </p>
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
                  Fires <a href="#webhooks"><code className="inline">delivery.cancelled</code></a>.
                  If a courier was already assigned, their app is told and their job screen stops.
                </p>
                <Code lang="json">{`{ "message": "Delivery cancelled" }`}</Code>
                <ul>
                  <li><strong>Already cancelled:</strong> repeating the call returns the same <code className="inline">200</code> and does nothing, with no second webhook.</li>
                  <li><strong>Already completed:</strong> <code className="inline">409</code> “Delivery already completed”.</li>
                  <li><strong>Changed meanwhile:</strong> if its status changed while you were cancelling, for example an offer was accepted at that moment, <code className="inline">409</code> “The delivery changed while cancelling. Fetch it and try again.”</li>
                </ul>
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

            {/* Webhooks */}
            <h2 id="webhooks">Webhooks</h2>
            <p>
              Instead of polling, let FastLinQ POST events to your server. Webhook URLs are set by
              the FastLinQ team: send us an <strong>https</strong> URL and we’ll register it and give
              you its signing secret. The secret is shown <strong>only once</strong>, so store it
              like your API key. Your sandbox has its own URL and secret (see{' '}
              <a href="#sandbox-webhooks">Sandbox webhooks</a>); live events go only to the live
              URL.
            </p>
            <p>Every event is a JSON POST with the same envelope:</p>
            <Code lang="http">{`POST /your/webhook
Content-Type: application/json
X-FastLinQ-Event: delivery.completed
X-FastLinQ-Signature: sha256=5f2b9c...e41a

{
  "event": "delivery.completed",
  "created_at": "2026-08-24T11:02:41.000Z",
  "data": { "id": 1234, "external_ref": "ORDER-4821", "delivered_on": 1787569361000 }
}`}</Code>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead><tr><th>Header</th><th>Value</th></tr></thead>
                <tbody>
                  <tr><td><code className="inline">Content-Type</code></td><td><code className="inline">application/json</code></td></tr>
                  <tr><td><code className="inline">X-FastLinQ-Event</code></td><td>The event name, same as <code className="inline">event</code> in the body</td></tr>
                  <tr><td><code className="inline">X-FastLinQ-Signature</code></td><td><code className="inline">sha256=</code> followed by the hex HMAC-SHA256 of the raw body, keyed with your signing secret. Sent whenever a secret is set.</td></tr>
                  <tr><td><code className="inline">X-FastLinQ-Mode</code></td><td><code className="inline">test</code>, on sandbox events only</td></tr>
                </tbody>
              </table>
            </div>
            <p className="dev-table-note">
              In the body, <code className="inline">created_at</code> is ISO 8601 and is when the
              event was sent.
            </p>

            <h3>Events</h3>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead><tr><th>Event</th><th>Fires when</th><th><code className="inline">data</code></th></tr></thead>
                <tbody>
                  <tr><td><code className="inline">offer.received</code></td><td>A courier makes an offer on a delivery that is still unassigned</td><td><code className="inline">{'{ delivery_id, external_ref, offer }'}</code>, where <code className="inline">offer</code> is an <a href="#models">Offer</a></td></tr>
                  <tr><td><code className="inline">delivery.assigned</code></td><td>You <a href="#accept">accept an offer</a></td><td>The full <a href="#models">Delivery</a> object</td></tr>
                  <tr><td><code className="inline">delivery.completed</code></td><td>The delivery code is entered, by you with <a href="#confirm">confirm-delivery</a> or by the courier in the app</td><td><code className="inline">{'{ id, external_ref, delivered_on }'}</code>, <code className="inline">delivered_on</code> in epoch ms</td></tr>
                  <tr><td><code className="inline">delivery.cancelled</code></td><td>You <a href="#cancel">cancel the delivery</a></td><td><code className="inline">{'{ id, external_ref, reason }'}</code></td></tr>
                </tbody>
              </table>
            </div>
            <Code lang="json">{`{
  "event": "offer.received",
  "created_at": "2026-08-24T10:31:09.000Z",
  "data": {
    "delivery_id": 1234,
    "external_ref": "ORDER-4821",
    "offer": {
      "transporter_user_id": "8ac1...",
      "offer_amount": 9.00,
      "vehicle_id": "b1f2c3d4",
      "carrier_vehicle": 412,
      "distance_to_pickup": { "text": "1.2 km", "value": 1200 },
      "created_at": 1787567469000,
      "carrier": { "name": "John M", "photo_id": "...", "vehicle": { } }
    }
  }
}`}</Code>

            <h3 id="webhook-verify">Verify the signature</h3>
            <p>
              Compute the HMAC-SHA256 of the <strong>raw request body</strong>, exactly as received
              and before any JSON parsing, keyed with your whole signing secret (including its{' '}
              <code className="inline">whsec_</code> prefix). Prefix the hex digest with{' '}
              <code className="inline">sha256=</code> and compare it to{' '}
              <code className="inline">X-FastLinQ-Signature</code> in constant time. Reject the
              request if they differ. In Node.js with Express:
            </p>
            <Code lang="javascript">{`import crypto from 'node:crypto';
import express from 'express';

const app = express();

// express.raw keeps the exact bytes FastLinQ signed.
app.post('/fastlinq/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const expected = Buffer.from(
    'sha256=' +
      crypto.createHmac('sha256', process.env.FASTLINQ_WEBHOOK_SECRET)
        .update(req.body)
        .digest('hex'),
  );
  const received = Buffer.from(req.get('X-FastLinQ-Signature') ?? '');
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return res.status(401).end();
  }

  res.status(200).end(); // acknowledge first, then process

  const { event, data } = JSON.parse(req.body.toString('utf8'));
  handleEvent(event, data); // your code: dedupe, then update the order
});`}</Code>

            <h3>Delivery and retries</h3>
            <ul>
              <li><strong>Best effort.</strong> Each event is sent with a 6-second timeout. If your endpoint times out or answers with a non-2xx status, we retry once about 1.5 seconds later, then drop the event.</li>
              <li><strong>Respond fast.</strong> Return a <code className="inline">2xx</code> straight away and do any slow work afterwards.</li>
              <li><strong>Dedupe.</strong> An event can arrive twice, for example when your server handled it but answered too slowly. Make handlers safe to repeat, keyed on the event name and delivery id (plus <code className="inline">transporter_user_id</code> and <code className="inline">created_at</code> for offers).</li>
              <li><strong>Don’t rely on webhooks alone.</strong> A dropped event is not resent, so use <a href="#get">Get a delivery</a> as the source of truth, for example to check open deliveries now and then.</li>
            </ul>

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
                  <tr><td><code className="inline">raw_status</code></td><td>string</td><td>The stored value: pending · in-progress · completed · cancelled. It is <code className="inline">in-progress</code> while a courier has the delivery (<code className="inline">status</code> <code className="inline">assigned</code>). The list endpoint’s <code className="inline">?status=</code> filters on this value.</td></tr>
                  <tr><td><code className="inline">recipient</code></td><td>object</td><td><code className="inline">{'{ name, phone }'}</code></td></tr>
                  <tr><td><code className="inline">pickup</code> / <code className="inline">dropoff</code></td><td>Location</td><td><code className="inline">{'{ formatted_address, lat, lng }'}</code></td></tr>
                  <tr><td><code className="inline">vehicle_id</code></td><td>string</td><td>Vehicle type</td></tr>
                  <tr><td><code className="inline">delivery_fee</code></td><td>number</td><td>Agreed (or recommended, until accepted) fee, USD</td></tr>
                  <tr><td><code className="inline">delivery_code</code></td><td>string</td><td>6 chars — give to your recipient</td></tr>
                  <tr><td><code className="inline">distance</code></td><td>number</td><td>Metres</td></tr>
                  <tr><td><code className="inline">content_description</code></td><td>string | null</td><td>What is being sent</td></tr>
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
              <code className="inline">distance_to_pickup</code> ({'{ text, value }'}, e.g.{' '}
              <code className="inline">{'{ "text": "1.4 km", "value": 1400 }'}</code> with value in
              metres, or null),{' '}
              <code className="inline">created_at</code> (epoch ms), and{' '}
              <code className="inline">carrier</code> ({'{ name, photo_id, vehicle }'}). Offers
              disappear 6 hours after the latest one on a delivery arrived.
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
                  <tr><td><code className="inline">403</code></td><td>Key lacks the required scope, or a live key called the sandbox advance endpoint</td></tr>
                  <tr><td><code className="inline">404</code></td><td>Delivery or offer not found</td></tr>
                  <tr><td><code className="inline">409</code></td><td>Conflict: offline courier, already assigned, delivery already completed or cancelled, delivery changed while cancelling, or a sandbox advance that can’t run yet</td></tr>
                  <tr><td><code className="inline">500</code></td><td>Server error</td></tr>
                </tbody>
              </table>
            </div>
            <p className="dev-table-note">
              The <code className="inline">409</code> messages: on <a href="#accept">accept</a>,
              “Carrier is offline. A carrier must be online to accept the delivery.”, “Delivery
              already assigned to a carrier”, or “Delivery is already closed” (cancelled or
              completed, even while accepting). On <a href="#confirm">confirm-delivery</a>,
              “Delivery was cancelled”. On <a href="#cancel">cancel</a>, “Delivery already
              completed” or “The delivery changed while cancelling. Fetch it and try again.”
              Repeating a cancel is not an error: it returns <code className="inline">200</code> and
              does nothing.
            </p>
            <p className="dev-table-note">
              Sandbox only: <code className="inline">POST /api/v1/sandbox/deliveries/:id/advance</code>{' '}
              checks the scope first, so a key without <code className="inline">deliveries:write</code>{' '}
              gets <code className="inline">403</code> “Missing required scope: deliveries:write”.
              Then a live key gets <code className="inline">403</code> “Sandbox endpoints only work
              with a test key (flq_test_...)”. <a href="#sandbox-advance">Advance</a> returns{' '}
              <code className="inline">409</code> “Accept an offer first: nobody is driving this
              delivery yet” before an offer is accepted, <code className="inline">409</code>{' '}
              “Delivery is already closed” once the delivery is completed or cancelled, and{' '}
              <code className="inline">409</code> “The delivery changed while advancing. Fetch it
              and try again.” if two advance calls race.
            </p>

            {/* Best practices */}
            <h2 id="practices">Best practices</h2>
            <ul>
              <li><strong>Keep your API key server-side.</strong> If a key is ever exposed, ask us to revoke and reissue it.</li>
              <li><strong>Poll offers</strong> every few seconds while a delivery is pending; stop once you accept or the list is empty and a carrier is set.</li>
              <li><strong>Handle the offline case.</strong> A courier must be online to be assigned — if accept returns 409 “Carrier is offline”, accept a different offer.</li>
              <li><strong>Verify and dedupe webhooks.</strong> Check <code className="inline">X-FastLinQ-Signature</code> on every event, answer with a 2xx fast, and expect the odd duplicate. See <a href="#webhooks">Webhooks</a>.</li>
              <li><strong>The delivery code is a shared secret</strong> between you and your recipient. Deliver it to the recipient only; hand-over completes when the code is accepted.</li>
              <li><strong>Units:</strong> amounts are USD and distances are metres. <code className="inline">delivered_on</code>, <code className="inline">current_location.updated_at</code>, and an offer’s <code className="inline">created_at</code> are epoch milliseconds. A delivery’s <code className="inline">created_at</code> and a webhook envelope’s <code className="inline">created_at</code> are ISO 8601.</li>
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
