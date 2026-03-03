import { BADGE_CATEGORIES } from "@/lib/features/badges";

import type { GoalsSectionProps } from "../goals-types";
import s from "../style.module.css";
import { GoalCard } from "./GoalCard";

export function GoalsSection({ goalsByCategory, badges }: GoalsSectionProps) {
  return (
    <section className={s.goalsSection}>
      <h2 className={s.sectionTitle}>What to Do Next</h2>
      {Object.entries(goalsByCategory).map(([category, goals]) => (
        <div key={category} className={s.goalCategory}>
          <h3 className={s.goalCategoryTitle}>
            {BADGE_CATEGORIES.find((c) => c.id === category)?.label || category}
          </h3>
          <div className={s.goalsList}>
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} badges={badges} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
