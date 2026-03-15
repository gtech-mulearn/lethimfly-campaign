'use client';

import { useState } from 'react';

const faqs = [
  {
    q: 'What is the #LetHimFly campaign?',
    a: "It's a community-driven initiative to help Syam Kumar S, a para skydiver, represent India at the 2026 International Indoor Para Skydiving Championship. We're raising ₹50,00,000 through student micro-commitments across campuses.",
  },
  {
    q: 'How does the payment work?',
    a: "You pay directly to the campaign's dedicated bank account using UPI or bank transfer. This platform does NOT process any payments; it only records your commitment and verifies your transaction reference (UTR).",
  },
  {
    q: 'What is a UTR number?',
    a: "UTR (Unique Transaction Reference) is a unique number assigned to every UPI or NEFT/IMPS/RTGS transaction. You can find it in your payment app's transaction details or bank SMS/email notification.",
  },
  {
    q: 'What happens after I submit my UTR?',
    a: "Your submission goes into a verification queue. An admin will cross-reference your UTR with the campaign account's bank statement. Once verified, your campus earns Karma points on the leaderboard!",
  },
  {
    q: 'What is Campus Karma?',
    a: "Campus Karma is a points system that rewards campuses for verified contributions. Every verified contributor earns a fixed amount of Karma for their campus, plus tier bonuses based on total verified contributors. It's designed to be fair: the Karma is based on headcount, not donation amount.",
  },
  {
    q: 'Can I commit more than ₹1?',
    a: 'Yes! The ₹1 challenge starts at Re 1; you can commit any amount. Campus Karma is based on the number of verified contributors, not the amount, so every contribution counts equally for leaderboard rankings.',
  },
  {
    q: 'What if my submission gets rejected?',
    a: 'If your UTR submission is rejected, you\'ll see the reason (e.g., invalid UTR, unclear screenshot). You can resubmit with the correct details. Use the "Track Status" page to check your verification status.',
  },
  {
    q: 'Is my personal information safe?',
    a: "We practice PII minimization. Phone numbers are masked in admin views, and we only collect what's necessary for verification. Your data is stored securely and used solely for this campaign.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {faqs.map((faq, i) => (
        <div key={i} className="faq-item">
          <button
            className={`faq-question ${openIndex === i ? 'open' : ''}`}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            {faq.q}
            <span className="icon">▼</span>
          </button>
          <div className={`faq-answer ${openIndex === i ? 'open' : ''}`}>{faq.a}</div>
        </div>
      ))}
    </div>
  );
}
