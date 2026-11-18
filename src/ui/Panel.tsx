import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** A glass card with an icon, a title and a quiet qualifier on the right. */
export function Panel({
  title,
  meta,
  icon,
  className = '',
  children,
}: {
  title: string;
  meta?: ReactNode;
  icon: IconName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`board-panel glass ${className}`.trim()}>
      <h2>
        <span className="panel-icon">
          <Icon name={icon} size={24} />
        </span>
        {title}
        {meta ? <small>{meta}</small> : null}
      </h2>
      <div className="panel-body">{children}</div>
    </section>
  );
}
