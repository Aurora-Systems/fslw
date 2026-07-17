import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — FastLinQ',
  description:
    'The terms that govern your use of the FastLinQ delivery platform, for both clients and couriers.',
};

const LAST_UPDATED = '17 July 2026';

export default function TermsAndConditions() {
  return (
    <>
      <section className="doc-hero">
        <div className="container">
          <h1>Terms &amp; Conditions</h1>
          <p>
            These terms govern your use of the FastLinQ platform, whether you post deliveries as a
            client or carry them as a courier. Please read them carefully.
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
                <li><a href="#agreement">Agreement</a></li>
                <li><a href="#what-we-are">What FastLinQ is</a></li>
                <li><a href="#accounts">Accounts &amp; eligibility</a></li>
                <li><a href="#roles">Clients and couriers</a></li>
                <li><a href="#courier-requirements">Courier requirements</a></li>
                <li><a href="#posting">Posting a delivery</a></li>
                <li><a href="#pricing">Pricing &amp; offers</a></li>
                <li><a href="#fees">Platform fee &amp; wallet</a></li>
                <li><a href="#delivery">Completing a delivery</a></li>
                <li><a href="#cancellations">Cancellations</a></li>
                <li><a href="#prohibited">Prohibited items &amp; conduct</a></li>
                <li><a href="#liability">Liability</a></li>
                <li><a href="#indemnity">Indemnity</a></li>
                <li><a href="#suspension">Suspension &amp; termination</a></li>
                <li><a href="#changes">Changes to these terms</a></li>
                <li><a href="#law">Governing law</a></li>
                <li><a href="#contact">Contact</a></li>
              </ol>
            </nav>

            <h2 id="agreement">1. Agreement</h2>
            <p>
              By creating a FastLinQ account or using our apps or website, you agree to these Terms
              &amp; Conditions and to our{' '}
              <a href="/legal/privacy-policy">Privacy Policy</a>. If you do not agree, please
              don&rsquo;t use the service.
            </p>

            <h2 id="what-we-are">2. What FastLinQ is</h2>
            <p>
              FastLinQ is a <strong>marketplace</strong>. We connect clients who need goods
              transported with independent couriers who choose to carry them. We introduce the two
              parties and provide the tools — matching, offers, tracking, messaging and payment —
              but:
            </p>
            <ul>
              <li>
                <strong>We are not a courier or freight carrier</strong> and we do not transport
                goods ourselves.
              </li>
              <li>
                Couriers are <strong>independent contractors</strong>, not our employees or agents.
              </li>
              <li>
                The transport contract for any delivery is between the{' '}
                <strong>client and the courier</strong>. FastLinQ is not a party to it.
              </li>
            </ul>

            <h2 id="accounts">3. Accounts &amp; eligibility</h2>
            <ul>
              <li>You must be at least 18 years old and able to enter into a binding contract.</li>
              <li>
                You register with your mobile number and verify it with a one-time password. Keep
                your phone and account secure — activity through your account is your
                responsibility.
              </li>
              <li>Your information must be accurate and kept up to date.</li>
              <li>One account per person. Don&rsquo;t impersonate anyone or use false details.</li>
            </ul>

            <h2 id="roles">4. Clients and couriers</h2>
            <p>
              A single account can act as a <strong>client</strong> (posting deliveries) or a{' '}
              <strong>driver</strong> (carrying them), and you can switch between the two in the
              app. The obligations in these terms apply to you according to the role you are acting
              in at the time.
            </p>

            <h2 id="courier-requirements">5. Courier requirements</h2>
            <p>Before you can accept deliveries, you must:</p>
            <ul>
              <li>
                Complete <strong>identity verification</strong> (a government ID or passport plus a
                liveness check) through our verification partner.
              </li>
              <li>
                Register a vehicle with accurate details and documentation, including registration
                (VRN) and VIN, and upload the required photographs.
              </li>
              <li>
                Hold and maintain everything the law requires for you to carry goods — a valid
                licence, roadworthy and insured vehicle, and any permits that apply. Where a vehicle
                is shown as carrying goods-in-transit cover, that must be true and current.
              </li>
              <li>Have sufficient wallet balance to cover the platform fee (see below).</li>
            </ul>
            <p>
              Your account must be approved and verified to make offers. We may re-check or withdraw
              approval at any time.
            </p>

            <h2 id="posting">6. Posting a delivery</h2>
            <p>As a client, you are responsible for:</p>
            <ul>
              <li>
                Describing the goods accurately — contents, estimated mass, and whether they are
                dangerous.
              </li>
              <li>Providing correct pickup and drop-off locations, dates and payment terms.</li>
              <li>
                Ensuring you are entitled to send the goods and that they are legal and properly
                packaged.
              </li>
            </ul>
            <p>
              Inaccurate or misleading job details may result in a courier declining or abandoning
              the delivery, and may make you responsible for costs incurred.
            </p>

            <h2 id="pricing">7. Pricing &amp; offers</h2>
            <p>
              For each delivery we calculate a <strong>recommended price</strong> based on the
              distance and the rate for the selected vehicle class.
            </p>
            <ul>
              <li>
                <strong>Clients</strong> may negotiate the price down, to a floor of{' '}
                <strong>20% below the recommended price</strong>.
              </li>
              <li>
                <strong>Couriers</strong> may accept the price as posted or{' '}
                <strong>offer a higher amount</strong> — couriers cannot offer below the recommended
                price.
              </li>
              <li>
                Offers are time-limited and may expire, or be withdrawn by the courier, before you
                accept them.
              </li>
              <li>
                A delivery is only agreed when the client <strong>accepts</strong> a specific
                courier&rsquo;s offer. Only one courier can be assigned to a job — once a job is
                taken, other offers lapse.
              </li>
            </ul>

            <h2 id="fees">8. Platform fee &amp; wallet</h2>
            <ul>
              <li>
                When a client accepts a courier&rsquo;s offer, FastLinQ charges the courier a
                platform fee of <strong>7% of the accepted amount</strong>, deducted from the
                courier&rsquo;s in-app wallet at the point of acceptance.
              </li>
              <li>
                Couriers must maintain enough wallet balance to cover the fee. If the fee cannot be
                deducted, the job will not be assigned.
              </li>
              <li>Wallet top-ups are processed by Stripe.</li>
              <li>
                The delivery charge itself is settled between the client and courier according to
                the payment terms agreed for that job.
              </li>
              <li>
                We may change our fees. Changes apply to deliveries agreed after the change takes
                effect.
              </li>
            </ul>

            <h2 id="delivery">9. Completing a delivery</h2>
            <p>
              Each job has a <strong>delivery code</strong>. The client gives this code to the
              courier on hand-over, and the courier enters it in the app to confirm the delivery is
              complete. Don&rsquo;t share your delivery code before the goods are actually handed
              over — it is the proof that delivery happened.
            </p>

            <h2 id="cancellations">10. Cancellations</h2>
            <ul>
              <li>A client may cancel a delivery in the app. Where a courier has already been assigned, cancelling may affect any platform fee already charged, which we will refund to the courier&rsquo;s wallet where appropriate.</li>
              <li>
                Repeated cancellations, or cancelling after a courier has travelled to a pickup, may
                lead to restrictions on your account.
              </li>
            </ul>

            <h2 id="prohibited">11. Prohibited items &amp; conduct</h2>
            <p>You must not use FastLinQ to send, carry or arrange:</p>
            <ul>
              <li>Anything illegal, stolen, or that you are not entitled to send.</li>
              <li>Drugs, weapons, explosives, or hazardous materials except where lawful, correctly declared as dangerous and agreed with the courier.</li>
              <li>Live animals or human remains.</li>
              <li>Cash, or items whose carriage would breach any law or the courier&rsquo;s insurance.</li>
            </ul>
            <p>You also must not:</p>
            <ul>
              <li>Arrange deliveries outside the platform to avoid fees, after matching on it.</li>
              <li>Harass, threaten or discriminate against another user.</li>
              <li>Interfere with, scrape or attempt to break the service, or use it fraudulently.</li>
            </ul>

            <h2 id="liability">12. Liability</h2>
            <p>
              The platform is provided &ldquo;as is&rdquo;. We work hard to keep it running, but we
              do not guarantee that a courier will be found, that a delivery will be made on time,
              or that the service will be uninterrupted or error-free.
            </p>
            <p>
              Because the transport contract is between the client and the courier, and couriers are
              independent contractors,{' '}
              <strong>
                FastLinQ is not responsible for loss of, damage to, or delay of goods
              </strong>
              , nor for the acts or omissions of any user. Claims relating to goods should be raised
              with the courier and their insurer.
            </p>
            <p>
              Nothing in these terms excludes liability that cannot lawfully be excluded. Subject to
              that, our total liability to you for any claim connected with the service is limited
              to the platform fees you paid us in respect of the delivery giving rise to the claim.
            </p>

            <h2 id="indemnity">13. Indemnity</h2>
            <p>
              You agree to indemnify FastLinQ against claims, losses and costs arising from your use
              of the service, your breach of these terms, your breach of any law, or any dispute
              between you and another user.
            </p>

            <h2 id="suspension">14. Suspension &amp; termination</h2>
            <p>
              We may suspend or close an account that breaches these terms, is used fraudulently, or
              poses a risk to other users or the platform. You can stop using FastLinQ at any time
              and can request deletion of your account at{' '}
              <a href="/user/data">fastlinq.app/user/data</a>. Outstanding deliveries and balances
              must be settled first.
            </p>

            <h2 id="changes">15. Changes to these terms</h2>
            <p>
              We may update these terms as the service develops. We&rsquo;ll revise the &ldquo;last
              updated&rdquo; date and, for significant changes, notify you in the app. Continuing to
              use FastLinQ after a change means you accept the updated terms.
            </p>

            <h2 id="law">16. Governing law</h2>
            <p>
              These terms are governed by the laws of Zimbabwe, and the courts of Zimbabwe have
              jurisdiction over any dispute, unless the law that applies where you live requires
              otherwise.
            </p>

            <h2 id="contact">17. Contact</h2>
            <p>
              Questions about these terms:{' '}
              <a href="mailto:support@fastlinq.app">support@fastlinq.app</a>.
              <br />
              Business enquiries:{' '}
              <a href="mailto:business@fastlinq.app">business@fastlinq.app</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
