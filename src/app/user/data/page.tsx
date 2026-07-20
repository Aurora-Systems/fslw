import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Data & Account Deletion — FastLinQ',
  description:
    'Request a copy of your FastLinQ data, or delete your FastLinQ profile and personal information.',
};

const DELETE_SUBJECT = encodeURIComponent('Account deletion request');
const DELETE_BODY = encodeURIComponent(
  'I would like my FastLinQ account and personal information deleted.\n\n' +
    'Phone number on the account (with country code): \n' +
    'Full name: \n\n' +
    'I understand that any active deliveries and outstanding balance must be settled first.',
);

const EXPORT_SUBJECT = encodeURIComponent('Data access request');
const EXPORT_BODY = encodeURIComponent(
  'I would like a copy of the personal information FastLinQ holds about me.\n\n' +
    'Phone number on the account (with country code): \n' +
    'Full name: \n',
);

export default function UserData() {
  return (
    <>
      <section className="doc-hero">
        <div className="container">
          <h1>Your data &amp; account deletion</h1>
          <p>
            You control your information on FastLinQ. Use this page to request a copy of your data,
            or to delete your profile and personal information entirely.
          </p>
        </div>
      </section>

      <section className="doc-body">
        <div className="container">
          <div className="doc-wrap">
            <h2 id="requests">Make a request</h2>
            <p>
              Send us a request using one of the options below, from any email address you like — we
              will verify your identity using the mobile number registered to your account before we
              action it.
            </p>

            <div className="doc-actions">
              <div className="doc-action">
                <h3>Delete my account</h3>
                <p>
                  Permanently deletes your FastLinQ profile and personal information. This
                  can&rsquo;t be undone.
                </p>
                <a
                  className="btn btn-primary"
                  href={`mailto:support@fastlinq.app?subject=${DELETE_SUBJECT}&body=${DELETE_BODY}`}
                >
                  Request deletion
                </a>
              </div>

              <div className="doc-action">
                <h3>Request my data</h3>
                <p>
                  Get a copy of the personal information we hold about you, including your profile
                  and delivery history.
                </p>
                <a
                  className="btn btn-outline"
                  href={`mailto:support@fastlinq.app?subject=${EXPORT_SUBJECT}&body=${EXPORT_BODY}`}
                >
                  Request my data
                </a>
              </div>
            </div>

            <div className="doc-note">
              <p>
                Before you delete: any <strong>active deliveries must be completed or cancelled</strong>,
                and any outstanding wallet balance or amount owed must be settled. We&rsquo;ll let
                you know if anything is outstanding.
              </p>
            </div>

            <h2 id="what-is-deleted">What gets deleted</h2>
            <p>When we action a deletion request we remove or anonymise:</p>
            <ul>
              <li>Your profile — name, date of birth, email, country and profile photo.</li>
              <li>Your mobile number and login credentials.</li>
              <li>Your vehicle records and uploaded vehicle photographs, if you drove with us.</li>
              <li>Your push notification registration, so we stop contacting you.</li>
              <li>Your in-app chat history.</li>
              <li>Your identity verification record (and we instruct our verification partner accordingly).</li>
            </ul>

            <h2 id="what-is-kept">What we may keep</h2>
            <p>
              We may need to retain a limited amount of information even after deletion, where the
              law requires it or to protect against fraud and legal claims. This typically includes:
            </p>
            <ul>
              <li>
                <strong>Transaction and delivery records</strong> needed for accounting, tax and
                dispute resolution — kept in a form that no longer identifies you where possible.
              </li>
              <li>
                Records of any unresolved dispute, chargeback or safety report, for as long as
                needed to resolve it.
              </li>
            </ul>
            <p>
              For more detail on what we collect and why, see our{' '}
              <a href="/legal/privacy-policy">Privacy Policy</a>.
            </p>

            <h2 id="timing">How long it takes</h2>
            <p>
              We aim to acknowledge requests within a few business days and to complete them within
              30 days. If we need more information to verify who you are, we&rsquo;ll contact you at
              the address you wrote from.
            </p>

            <h2 id="contact">Need help?</h2>
            <p>
              Email <a href="mailto:support@fastlinq.app">support@fastlinq.app</a> and we&rsquo;ll
              help you with any question about your data.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
