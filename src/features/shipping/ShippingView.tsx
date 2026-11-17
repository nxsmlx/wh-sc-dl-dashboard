import type { ShippingSnapshot } from '../../data/types';
import { IssueList } from '../../ui/IssueList';
import { StatusStream } from '../../ui/StatusStream';
import { TrendLine } from '../../ui/charts/TrendLine';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import './shipping-view.css';

const number = (value: number): string => value.toLocaleString('en-GB');

export function ShippingView({ data }: { data: ShippingSnapshot }) {
  const direction = data.lineDeltaPct < 0 ? 'down' : data.lineDeltaPct > 0 ? 'up' : 'flat';
  const issueDirection = data.issueCount - data.previousIssueCount;

  return (
    <section className="surface shipping-view">
      <div className="surface-heading">
        <h1 className="surface-title">Shipping check</h1>
      </div>

      <div className="ship-hero">
        <div className="ship-primary">
          <span className="hero-label">Lines this month</span>
          <span className="hero-value">{number(data.lineCount)}</span>
          <span className="hero-context" data-direction={direction}>
            {direction === 'flat' ? 'level' : `${data.lineDeltaPct > 0 ? '+' : ''}${data.lineDeltaPct}%`} vs{' '}
            {number(data.previousLineCount)} lines last month
          </span>
          <TrendLine title="Lines by month" points={data.monthlyLines} />
        </div>

        <dl className="ship-figures">
          <div>
            <dt>Issues this month</dt>
            <dd>{number(data.issueCount)}</dd>
            <p>
              {issueDirection === 0
                ? 'same as last month'
                : `${issueDirection > 0 ? '+' : ''}${issueDirection} issues vs last month`}
            </p>
          </div>
          <div>
            <dt>Issues per 10k lines</dt>
            <dd>{data.issueRatePer10k.toFixed(1)}</dd>
            <p>last month {data.previousIssueRatePer10k.toFixed(1)}</p>
          </div>
          <div>
            <dt>Quantity variance</dt>
            <dd>{number(data.qtyVarianceTotal)}</dd>
            <p>pieces short or extra</p>
          </div>
        </dl>
      </div>

      <div className="ship-status">
        <StatusStream statuses={data.shipmentStatuses} />
      </div>

      <div className="ship-lower">
        <section aria-labelledby="shipping-issues-heading">
          <h2 id="shipping-issues-heading">Recent issues</h2>
          <IssueList issues={data.recentIssues} />
        </section>
        <section className="ship-reasons" aria-labelledby="shipping-reasons-heading">
          <h2 id="shipping-reasons-heading">Issues by reason</h2>
          <HorizontalBars title="Issues this month" points={data.reasonBreakdown} />
        </section>
        <section className="ship-zones" aria-labelledby="shipping-zones-heading">
          <h2 id="shipping-zones-heading">Issues by workzone</h2>
          <HorizontalBars title="Issues this month" points={data.workzoneBreakdown} />
        </section>
      </div>
    </section>
  );
}
