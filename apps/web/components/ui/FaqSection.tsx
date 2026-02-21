interface FaqSectionProps {
  title: string;
  items: ReadonlyArray<{ readonly question: string; readonly answer: string }>;
  classes: {
    section: string;
    title: string;
    list: string;
    item: string;
    question: string;
    answer: string;
  };
}

export function FaqSection({ title, items, classes }: FaqSectionProps) {
  return (
    <section className={classes.section}>
      <h2 className={classes.title}>{title}</h2>
      <div className={classes.list}>
        {items.map((faq, idx) => (
          <details key={idx} className={classes.item}>
            <summary className={classes.question}>{faq.question}</summary>
            <p className={classes.answer}>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
