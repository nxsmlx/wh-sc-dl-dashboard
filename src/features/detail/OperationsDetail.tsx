import type { DashboardSnapshot, WallboardPage } from '../../data/types';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import { TrendLine } from '../../ui/charts/TrendLine';
import { IssueList } from '../../ui/IssueList';
import { StatusStream } from '../../ui/StatusStream';
import './operations-detail.css';

const pct = (value: number): string => `${value.toFixed(1)}%`;

export function OperationsDetail({
  page,
  snapshot,
  onBack,
}: {
  page: WallboardPage;
  snapshot: DashboardSnapshot;
  onBack: () => void;
}) {
  const isShipping = page === 'shipping';
  const title = isShipping ? 'Shipping check operations' : 'Delivery operations';
  const shipping = snapshot.shipping;
  const delivery = snapshot.delivery;
  const mixTotal = Math.max(1, delivery.mix.sameDay + delivery.mix.oneDay + delivery.mix.moreThanOneDay);

  return (
    <section className="operations-detail" aria-label={`${title} detail`}>
      <header className="detail-header">
        <div>
          <p className="detail-kicker">Operations detail · {isShipping ? shipping.monthLabel : delivery.monthLabel}</p>
          <h1>{title}</h1>
        </div>
        <button type="button" className="detail-back" onClick={onBack}>
          Back to wallboard
        </button>
      </header>

      {isShipping ? (
        <div className="detail-grid shipping-detail-grid">
          <section className="detail-section detail-wide">
            <h2>Issue-rate trend</h2>
            <TrendLine title="Issues per 10k lines" points={shipping.monthlyIssueRate} />
          </section>
          <section className="detail-section">
            <h2>Shipment status</h2>
            <StatusStream statuses={shipping.shipmentStatuses} />
          </section>
          <section className="detail-section">
            <h2>Quantity variance</h2>
            <p className="detail-big-number">{shipping.qtyVarianceTotal.toLocaleString('en-GB')}</p>
            <p className="detail-muted">pieces short or extra</p>
          </section>
          <section className="detail-section">
            <h2>Issues by reason</h2>
            <HorizontalBars title="Issue reason ranking" points={shipping.reasonBreakdown} />
          </section>
          <section className="detail-section">
            <h2>Issues by workzone</h2>
            <HorizontalBars title="Workzone ranking" points={shipping.workzoneBreakdown} />
          </section>
          <section className="detail-section detail-wide">
            <h2>Latest issues</h2>
            <IssueList issues={shipping.recentIssues} />
          </section>
        </div>
      ) : (
        <div className="detail-grid delivery-detail-grid">
          <section className="detail-section detail-wide">
            <h2>1-day result by region</h2>
            <HorizontalBars
              title={`Target ${pct(delivery.oneDayTargetPct)}`}
              points={delivery.regions.map((region) => ({ label: region.region, value: region.oneDayPct }))}
              suffix="%"
              decimals={1}
            />
          </section>
          <section className="detail-section">
            <h2>Delivery mix</h2>
            <ul className="detail-list">
              <li><span>Same day</span><strong>{delivery.mix.sameDay.toLocaleString('en-GB')}</strong><em>{pct((delivery.mix.sameDay / mixTotal) * 100)}</em></li>
              <li><span>1 day</span><strong>{delivery.mix.oneDay.toLocaleString('en-GB')}</strong><em>{pct((delivery.mix.oneDay / mixTotal) * 100)}</em></li>
              <li><span>More than 1 day</span><strong>{delivery.mix.moreThanOneDay.toLocaleString('en-GB')}</strong><em>{pct((delivery.mix.moreThanOneDay / mixTotal) * 100)}</em></li>
            </ul>
          </section>
          <section className="detail-section">
            <h2>Transporter issue types</h2>
            <HorizontalBars title="Issue type ranking" points={delivery.transporterByType} />
          </section>
          <section className="detail-section">
            <h2>Lorry punctuality</h2>
            <p className="detail-big-number">{delivery.lorryPunctuality.ok} / {delivery.lorryPunctuality.ok + delivery.lorryPunctuality.ng}</p>
            <p className="detail-muted">on time · {delivery.lorryPunctuality.ng} late</p>
          </section>
          <section className="detail-section detail-wide">
            <h2>Latest transporter cases</h2>
            <ul className="issue-list">
              {delivery.recentTransporterIssues.map((issue) => (
                <li key={`${issue.date}-${issue.issue}-${issue.region}`} className="issue-row">
                  <time className="issue-date" dateTime={issue.date}>{issue.date.slice(5)}</time>
                  <span className="issue-zone">{issue.region}</span>
                  <span className="issue-detail">{issue.issue}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="detail-section detail-wide">
            <h2>Lorry plan</h2>
            <ol className="detail-lorry-list">
              {delivery.lorryPlan.map((slot) => (
                <li key={`${slot.timeSlot}-${slot.plate}`}>
                  <span>{slot.timeSlot}</span><span>{slot.lot}</span><span>{slot.plate}</span><strong data-status={slot.arrivalStatus}>{slot.arrivalStatus}</strong>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </section>
  );
}
