import type { IssueRow } from '../data/types';

export function IssueList({ issues }: { issues: IssueRow[] }) {
  if (issues.length === 0) {
    return <p className="chart-empty">No issues logged this month</p>;
  }

  return (
    <ul className="issue-list" aria-label="Recent shipping check issues">
      {issues.map((issue) => (
        <li key={`${issue.date}-${issue.workzone}-${issue.reason}`} className="issue-row">
          <time className="issue-date" dateTime={issue.date}>
            {issue.date.slice(5)}
          </time>
          <span className="issue-zone">{issue.workzone}</span>
          <span className="issue-reason">{issue.reason}</span>
          <span className="issue-detail">{issue.detail}</span>
        </li>
      ))}
    </ul>
  );
}
