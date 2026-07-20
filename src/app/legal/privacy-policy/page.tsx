import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — FastLinQ',
  description:
    'How FastLinQ collects, uses, shares and protects your personal information when you use the FastLinQ delivery platform.',
};

const LAST_UPDATED = '17 July 2026';

export default function PrivacyPolicy() {
  return (
    <>
      <section className="doc-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>
            This policy explains what information FastLinQ collects when you use our apps and
            website, why we collect it, who we share it with, and the choices you have.
          </p>
          <div className="doc-updated">Last updated: {LAST_UPDATED}</div>
        </div>
      </section>

      <section className="doc-body">
        <div className="container">
          <div className="doc-wrap">
            <nav className="doc-toc" aria-label="Table of contents">
              <div className="doc-toc-title">On this page</div>
              <ol>
                <li><a href="#who-we-are">Who we are</a></li>
                <li><a href="#what-we-collect">Information we collect</a></li>
                <li><a href="#how-we-use">How we use your information</a></li>
                <li><a href="#location">Location data</a></li>
                <li><a href="#sharing">Sharing your information</a></li>
                <li><a href="#processors">Service providers</a></li>
                <li><a href="#retention">How long we keep it</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#rights">Your rights &amp; choices</a></li>
                <li><a href="#deletion">Deleting your account</a></li>
                <li><a href="#children">Children</a></li>
                <li><a href="#transfers">International transfers</a></li>
                <li><a href="#changes">Changes to this policy</a></li>
                <li><a href="#contact">Contact us</a></li>
              </ol>
            </nav>

            <h2 id="who-we-are">1. Who we are</h2>
            <p>
              FastLinQ (&ldquo;FastLinQ&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a
              platform that connects clients who need goods transported with independent couriers
              (&ldquo;drivers&rdquo;). This policy applies to the FastLinQ mobile apps, our website
              at fastlinq.app, and related services.
            </p>
            <p>
              We are the controller of the personal information described here. If you have any
              questions about this policy, contact us at{' '}
              <a href="mailto:support@fastlinq.app">support@fastlinq.app</a>.
            </p>

            <h2 id="what-we-collect">2. Information we collect</h2>

            <h3>Account and profile information</h3>
            <ul>
              <li>
                <strong>Mobile number.</strong> You sign in with your phone number. We send a
                one-time password (OTP) to it by SMS or WhatsApp to verify it&rsquo;s you.
              </li>
              <li>
                <strong>Profile details.</strong> First and last name, date of birth, email
                address, country, and a profile photo.
              </li>
            </ul>

            <h3>Identity verification (drivers)</h3>
            <ul>
              <li>
                <strong>Government ID.</strong> To drive on FastLinQ you must complete an identity
                check. This is carried out by our verification partner, Didit, and involves
                submitting a national ID or passport and a selfie/liveness check.
              </li>
              <li>
                <strong>Verification result.</strong> We store a reference to your verification
                session and its outcome (for example, approved or pending). The identity documents
                themselves are held by Didit, not by us.
              </li>
            </ul>

            <h3>Vehicle information (drivers)</h3>
            <ul>
              <li>
                Vehicle type, make, model, colour, year, registration number (VRN), VIN, and
                whether the vehicle carries goods-in-transit insurance.
              </li>
              <li>Photographs of the vehicle and of its registration/VIN documentation.</li>
            </ul>

            <h3>Delivery information</h3>
            <ul>
              <li>
                Pickup and drop-off addresses and coordinates, a description of the goods,
                estimated mass, whether the contents are flagged as dangerous, pickup and delivery
                dates, payment terms, the delivery fee and offers made, and the delivery
                confirmation code.
              </li>
            </ul>

            <h3>Location information</h3>
            <ul>
              <li>
                Your device&rsquo;s location, used for pickup/drop-off selection and — for drivers
                on an active job — to show the client live progress. See{' '}
                <a href="#location">Location data</a> below.
              </li>
            </ul>

            <h3>Communications</h3>
            <ul>
              <li>
                In-app chat messages and voice/video call activity between a client and their
                driver for a delivery. These are carried by our messaging provider, Stream.
              </li>
              <li>Emails and messages you send to our support team.</li>
            </ul>

            <h3>Payment information</h3>
            <ul>
              <li>
                Wallet top-ups and transaction records. Card payments are handled by Stripe —{' '}
                <strong>we do not receive or store your full card details</strong>.
              </li>
            </ul>

            <h3>Device and technical information</h3>
            <ul>
              <li>
                A push notification identifier so we can send you alerts about jobs, offers and
                messages, plus basic app/device diagnostics and log data.
              </li>
            </ul>

            <h2 id="how-we-use">3. How we use your information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Create and secure your account, and verify your phone number.</li>
              <li>Match delivery requests with suitable, verified drivers nearby.</li>
              <li>Verify driver identity, vehicles and documentation, to keep the platform safe.</li>
              <li>Show live delivery tracking and estimated distances and prices.</li>
              <li>Let clients and drivers contact each other about an active delivery.</li>
              <li>Process wallet top-ups, delivery fees and platform fees.</li>
              <li>Send you service notifications (new job offers, offer accepted, messages, arrival and delivery updates).</li>
              <li>Provide support, investigate disputes, prevent fraud and misuse, and keep records we&rsquo;re legally required to keep.</li>
              <li>Improve and troubleshoot the service.</li>
            </ul>
            <p>
              We process this information because it is necessary to provide the service you asked
              for, to meet our legal obligations, to protect the safety of users, and — where
              required — with your consent (for example, device location and push notifications,
              which you can withdraw in your device settings).
            </p>

            <h2 id="location">4. Location data</h2>
            <p>
              Location is central to a delivery service, so we want to be specific about it:
            </p>
            <ul>
              <li>
                <strong>Clients.</strong> We use location to help you set pickup and drop-off
                points and to calculate distance and the recommended price.
              </li>
              <li>
                <strong>Drivers.</strong> While you are on an active job, your device shares its
                location so the client can track the delivery in progress and so we can measure
                distance to pickup. This happens while a job is in progress.
              </li>
              <li>
                You can turn off location permission at any time in your device settings. Some
                features — including accepting and completing deliveries — will not work without
                it.
              </li>
            </ul>

            <h2 id="sharing">5. Sharing your information</h2>
            <p>We share information only where it&rsquo;s needed to run the service:</p>
            <ul>
              <li>
                <strong>Between clients and drivers.</strong> When an offer is accepted, the client
                and the driver see each other&rsquo;s name and profile photo, the vehicle details,
                and can chat or call in the app. The client can see the driver&rsquo;s live location
                during the delivery. The driver sees the pickup and drop-off details.
              </li>
              <li>
                <strong>Service providers.</strong> The companies listed in{' '}
                <a href="#processors">section 6</a>, who process data on our behalf.
              </li>
              <li>
                <strong>Legal and safety.</strong> Where we are required by law, or where it is
                necessary to investigate fraud, protect someone&rsquo;s safety, or establish or
                defend legal claims.
              </li>
              <li>
                <strong>Business transfers.</strong> If our business is sold or reorganised, your
                information may transfer as part of that, subject to this policy.
              </li>
            </ul>
            <p>
              <strong>We do not sell your personal information</strong> and we do not share it with
              third parties for their own advertising.
            </p>

            <h2 id="processors">6. Service providers</h2>
            <p>
              We rely on the following providers. Each only receives what it needs to perform its
              function:
            </p>
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>What it does</th>
                    <th>Data involved</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Supabase</td>
                    <td>Authentication, database and file storage</td>
                    <td>Account, profile, vehicle, job records and uploaded images</td>
                  </tr>
                  <tr>
                    <td>Didit</td>
                    <td>Identity verification for drivers</td>
                    <td>ID document, selfie/liveness, verification result</td>
                  </tr>
                  <tr>
                    <td>Stream</td>
                    <td>In-app chat and voice/video calls</td>
                    <td>Name, profile photo, messages and call activity</td>
                  </tr>
                  <tr>
                    <td>OneSignal</td>
                    <td>Push notifications</td>
                    <td>Push subscription identifier, notification content</td>
                  </tr>
                  <tr>
                    <td>Google Maps Platform</td>
                    <td>Maps, addresses, routing and navigation</td>
                    <td>Pickup/drop-off and device location, route queries</td>
                  </tr>
                  <tr>
                    <td>Stripe</td>
                    <td>Payments and wallet top-ups</td>
                    <td>Payment details you enter with Stripe, transaction records</td>
                  </tr>
                  <tr>
                    <td>Microsoft Azure</td>
                    <td>Hosting and file delivery</td>
                    <td>Service data and files in transit/at rest</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="retention">7. How long we keep it</h2>
            <ul>
              <li>
                <strong>Account and profile:</strong> for as long as your account is active.
              </li>
              <li>
                <strong>Delivery records, offers and transactions:</strong> retained after a
                delivery completes so we can support disputes, refunds, tax and accounting
                obligations.
              </li>
              <li>
                <strong>Chat messages:</strong> retained for the life of the job record.
              </li>
              <li>
                <strong>Verification data:</strong> retained for as long as you are an approved
                driver, and afterwards where we must keep proof of the check.
              </li>
            </ul>
            <p>
              When you delete your account we remove or anonymise your personal information, except
              where we are required to keep certain records (for example, financial records).

            </p>

            <h2 id="security">8. Security</h2>
            <p>
              Traffic between the apps and our servers is encrypted in transit. Access to production
              data is restricted, payment card data is handled by Stripe and never reaches our
              servers, and identity documents are held by our verification partner rather than by
              us. No system is perfectly secure, so we encourage you to keep your device and phone
              number secure and to tell us immediately if you suspect misuse of your account.
            </p>

            <h2 id="rights">9. Your rights &amp; choices</h2>
            <p>You can ask us to:</p>
            <ul>
              <li>Give you a copy of the personal information we hold about you.</li>
              <li>Correct information that is wrong or out of date (much of this you can edit in your profile).</li>
              <li>Delete your account and personal information.</li>
              <li>Stop sending you notifications — you can turn these off in your device settings.</li>
            </ul>
            <p>
              To make a request, use{' '}
              <a href="/user/data">fastlinq.app/user/data</a> or email{' '}
              <a href="mailto:support@fastlinq.app">support@fastlinq.app</a>. We may need to verify
              your identity — usually via the phone number on your account — before we act on a
              request.
            </p>

            <h2 id="deletion">10. Deleting your account</h2>
            <div className="doc-note">
              <p>
                You can request deletion of your FastLinQ profile and a copy of your data at any
                time at <a href="/user/data">fastlinq.app/user/data</a>. Active deliveries and any
                outstanding balance must be settled first.
              </p>
            </div>

            <h2 id="children">11. Children</h2>
            <p>
              FastLinQ is not intended for anyone under 18, and we do not knowingly collect
              information from children. If you believe a child has given us their information,
              contact us and we will delete it.
            </p>

            <h2 id="transfers">12. International transfers</h2>
            <p>
              Our providers operate globally, so your information may be processed in countries
              other than your own. Where that happens we rely on providers that offer appropriate
              safeguards for the data they handle on our behalf.
            </p>

            <h2 id="changes">13. Changes to this policy</h2>
            <p>
              We may update this policy as the service changes. When we do, we&rsquo;ll revise the
              &ldquo;last updated&rdquo; date above, and for significant changes we&rsquo;ll let you
              know in the app.
            </p>

            <h2 id="contact">14. Contact us</h2>
            <p>
              Questions, requests or complaints about privacy:{' '}
              <a href="mailto:support@fastlinq.app">support@fastlinq.app</a>.
            </p>
            <p>
              See also our{' '}
              <a href="/legal/terms-and-conditions">Terms &amp; Conditions</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
