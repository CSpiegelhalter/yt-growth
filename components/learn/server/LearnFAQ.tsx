/**
 * Server component that renders the FAQ section with native details/summary.
 * Must remain a server component - no "use client" directive.
 */

interface FAQ {
  question: string;
  answer: string;
}

interface LearnFAQProps {
  faqs: readonly FAQ[];
  sectionId?: string;
  styles: {
    faqSection: string;
    faqTitle: string;
    faqList: string;
    faqItem: string;
    faqQuestion: string;
    faqQuestionText: string;
    faqChevron: string;
    faqAnswer: string;
  };
}

export function LearnFAQ({
  faqs,
  sectionId = "faq",
  styles: s,
}: LearnFAQProps) {
  return (
    <section id={sectionId} className={s.faqSection}>
      <h2 className={s.faqTitle}>Frequently Asked Questions</h2>
      <div className={s.faqList}>
        {faqs.map((faq, index) => (
          <details key={index} className={s.faqItem}>
            <summary className={s.faqQuestion}>
              <span className={s.faqQuestionText}>{faq.question}</span>
              <svg
                className={s.faqChevron}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <p className={s.faqAnswer}>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
