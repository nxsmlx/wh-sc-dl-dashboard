import type { DashboardSnapshot, WallboardPage } from '../../data/types';
import { HorizontalBars } from '../../ui/charts/HorizontalBars';
import { TrendLine } from '../../ui/charts/TrendLine';
import { IssueList } from '../../ui/IssueList';
import { StatusChip } from '../../ui/StatusChip';
import { StatusStream } from '../../ui/StatusStream';
import './operations-detail.css';

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
  const monthLabel = isShipping ? shipping.monthLabel : delivery.monthLabel;
  const lorryTotal = delivery.lorryPunctuality.ok + delivery.lorryPunctuality.ng;

  return (
    <section className="surface operations-detail" aria-label={`${title} detail`}>
      <header className="detail-header">
        <h1>{title}</h1>
        <span className="detail-period">{monthLabel}</span>
        <button type="button" className="detail-back" onClick={onBack}>
          Back to wallboard
        </button>
      </header>

      {isShipping ? (
        <div className="board-panels detail-panels">
          <section className="board-panel">
            <h2>
              Issue-rate trend<small>per 10k lines</small>
            </h2>
            <div className="panel-body">
              <TrendLine
                title="Issues per 10k lines"
                points={shipping.monthlyIssueRate}
                formatValue={(value) => value.toFixed(1)}
              />
            </div>
          </section>
          <section className="board-panel">
            <h2>Issues by reason</h2>
            <div className="panel-body">
              <HorizontalBars title="Issue reason ranking" points={shipping.reasonBreakdown} />
            </div>
          </section>
          <section className="board-panel">
            <h2>Issues by workzone</h2>
            <div className="panel-body">
              <HorizontalBars title="Workzone ranking" points={shipping.workzoneBreakdown} />
            </div>
          </section>
          <section className="board-panel">
            <h2>
              Shipment status<small>now</small>
            </h2>
            <div className="panel-body">
              <StatusStream statuses={shipping.shipmentStatuses} />
            </div>
          </section>
          <section className="board-panel board-wide">
            <h2>
              Latest issues<small>{shipping.monthLabel}</small>
            </h2>
            <div className="panel-body">
              <IssueList issues={shipping.recentIssues} />
            </div>
          </section>
        </div>
      ) : (
        <div className="board-panels detail-panels">
          <section className="board-panel">
            <h2>
              Region result<small>target {delivery.oneDayTargetPct.toFixed(1)}%</small>
            </h2>
            <div className="panel-body">
              <HorizontalBars
                title={`1-day result by region, target ${delivery.oneDayTargetPct.toFixed(1)}%`}
                points={delivery.regions.map((region) => ({ label: region.region, value: region.oneDayPct }))}
                suffix="%"
                decimals={1}
                belowIsAlert={delivery.oneDayTargetPct}
              />
            </div>
          </section>
          <section className="board-panel">
            <h2>Transporter issue types</h2>
            <div className="panel-body">
              <HorizontalBars title="Transporter issue type ranking" points={delivery.transporterByType} />
            </div>
          </section>
          <section className="board-panel">
            <h2>
              Lorry punctuality<small>latest plan</small>
            </h2>
            <div className="panel-body">
              <p className="detail-big-number">
                {delivery.lorryPunctuality.ok}
                <small> / {lorryTotal} on time</small>
              </p>
              {delivery.lorryPunctuality.ng > 0 ? (
                <StatusChip tone="warning" label={`${delivery.lorryPunctuality.ng} late`} />
              ) : (
                <StatusChip tone="success" label="All on time" />
              )}
            </div>
          </section>
          <section className="board-panel board-wide">
            <h2>
              Lorry plan<small>latest plan</small>
            </h2>
            <div className="panel-body">
              {delivery.lorryPlan.length > 0 ? (
                <ol className="detail-lorry-list">
                  {delivery.lorryPlan.map((slot) => (
                    <li key={`${slot.timeSlot}-${slot.plate}`}>
                      <span className="lorry-time">{slot.timeSlot}</span>
                      <span>{slot.lot}</span>
                      <span>{slot.plate}</span>
                      <StatusChip
                        tone={slot.arrivalStatus === 'OK' ? 'success' : 'danger'}
                        label={slot.arrivalStatus === 'OK' ? 'On time' : 'Late'}
                      />
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="chart-empty">No lorry plan loaded</p>
              )}
            </div>
          </section>
          <section className="board-panel">
            <h2>Latest transporter cases</h2>
            <div className="panel-body">
              <ul className="issue-list">
                {delivery.recentTransporterIssues.map((issue) => (
                  <li key={`${issue.date}-${issue.issue}-${issue.region}`} className="case-row">
                    <time className="issue-date" dateTime={issue.date}>
                      {issue.date.slice(8)}/{issue.date.slice(5, 7)}
                    </time>
                    <span className="issue-zone">{issue.region}</span>
                    <span className="issue-reason">{issue.issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
