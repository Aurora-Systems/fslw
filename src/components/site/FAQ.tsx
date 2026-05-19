'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How fast is a typical FastLinQ delivery?',
    answer:
      'Delivery time depends on distance and courier availability. Once a courier accepts your job — typically within a few minutes — you can follow progress live on the map.',
  },
  {
    question: 'How much does a delivery cost?',
    answer:
      'Fares are shown up-front before you confirm. Pricing is based on distance and vehicle type. No hidden fees — ever.',
  },
  {
    question: 'What can I send through FastLinQ?',
    answer:
      'Most everyday items — documents, packages, groceries, electronics, and more. Dangerous goods, hazardous materials, and illegal items are not permitted.',
  },
  {
    question: 'How do I become a courier?',
    answer:
      'Download the app, choose "Courier" during sign-up, complete our quick identity verification, and you\'re ready to start accepting jobs — usually within 24 hours.',
  },
  {
    question: 'Is my parcel insured?',
    answer:
      'Insurance depends on the courier. Couriers who hold a valid goods-in-transit insurance policy provide cover for parcels they carry. You can see a courier\'s insurance status on their profile before accepting a match.',
  },
  {
    question: 'Where does FastLinQ operate?',
    answer:
      'FastLinQ is a global platform. There are no geographic restrictions — wherever there are couriers and clients using the app, deliveries can happen.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="section" id="faq">
      <div className="container">
        <div className="grid-2" style={{ gap: '64px', alignItems: 'flex-start' }}>
          <div>
            <div className="eyebrow">FAQ</div>
            <h2 style={{ marginBottom: '20px' }}>
              Common <span className="grad-text">questions.</span>
            </h2>
            <p>
              Can&apos;t find an answer?
              <br />
              <a href="mailto:support@fastlinq.app" style={{ color: 'var(--blue)', fontWeight: 500 }}>
                Chat support →
              </a>
            </p>
          </div>
          <div>
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-item${openIndex === idx ? ' open' : ''}`}>
                <button className="faq-question" onClick={() => toggle(idx)}>
                  {faq.question}
                  <span className="faq-icon">+</span>
                </button>
                <div className="faq-answer">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
