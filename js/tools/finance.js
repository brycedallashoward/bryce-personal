import { load } from '../store.js';

export const label = 'Finance';

export async function render(el) {
  const data = await load('finance');

  if (!data || !data.lastRefreshed) {
    el.innerHTML = `<p class="empty-state">No data yet.<br>Ask Claude to run the finance refresh.</p>`;
    return;
  }

  const refreshed = new Date(data.lastRefreshed);
  const refreshedStr = refreshed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  el.innerHTML = `
    ${netWorthCard(data.netWorth)}
    ${cashflowCard(data.cashflow)}
    ${accountsCard(data.accounts)}
    ${transactionsCard(data.recentTransactions)}
    <p class="finance-refreshed">Updated ${refreshedStr}</p>
  `;
}

function netWorthCard(nw) {
  if (!nw) return '';
  const sign = nw.total >= 0 ? '' : '-';
  return `
    <div class="card">
      <div class="card-title">Net Worth</div>
      <div class="nw-total">${sign}${fmt(Math.abs(nw.total))}</div>
      <div class="nw-breakdown">
        <span class="nw-assets">↑ ${fmt(nw.assets)} assets</span>
        <span class="nw-liabilities">↓ ${fmt(nw.liabilities)} liabilities</span>
      </div>
    </div>
  `;
}

function cashflowCard(cf) {
  if (!cf) return '';
  const monthLabel = cf.month
    ? new Date(cf.month + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';
  const net = cf.net;
  const netClass = net >= 0 ? 'cf-positive' : 'cf-negative';
  const savingsPct = cf.savingsRate ? Math.round(cf.savingsRate * 100) + '%' : null;

  return `
    <div class="card">
      <div class="card-title">Cashflow — ${monthLabel}</div>
      <div class="cf-row">
        <div class="cf-item">
          <div class="cf-label">Income</div>
          <div class="cf-value cf-income">${fmt(cf.income)}</div>
        </div>
        <div class="cf-item">
          <div class="cf-label">Expenses</div>
          <div class="cf-value cf-expense">${fmt(cf.expenses)}</div>
        </div>
        <div class="cf-item">
          <div class="cf-label">Net${savingsPct ? ` (${savingsPct})` : ''}</div>
          <div class="cf-value ${netClass}">${net >= 0 ? '+' : ''}${fmt(net)}</div>
        </div>
      </div>
    </div>
  `;
}

function accountsCard(accounts) {
  if (!accounts || !accounts.length) return '';
  const sorted = [...accounts].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  const rows = sorted.map(a => `
    <div class="acct-row">
      <div class="acct-name">
        <span>${a.name}</span>
        ${a.institution ? `<span class="acct-inst">${a.institution}</span>` : ''}
      </div>
      <div class="acct-balance ${a.isLiability ? 'acct-liability' : ''}">${a.isLiability ? '-' : ''}${fmt(Math.abs(a.balance))}</div>
    </div>
  `).join('');
  return `
    <div class="card">
      <div class="card-title">Accounts</div>
      ${rows}
    </div>
  `;
}

function transactionsCard(txns) {
  if (!txns || !txns.length) return '';
  const rows = txns.slice(0, 10).map(t => {
    const d = new Date(t.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <div class="txn-row">
        <div class="txn-left">
          <div class="txn-merchant">${t.merchant || '—'}${t.pending ? ' <span class="txn-pending">pending</span>' : ''}</div>
          <div class="txn-meta">${dateStr}${t.category ? ` · ${t.category}` : ''}</div>
        </div>
        <div class="txn-amount ${t.amount < 0 ? 'txn-credit' : ''}">${t.amount < 0 ? '+' : ''}${fmt(Math.abs(t.amount))}</div>
      </div>
    `;
  }).join('');
  return `
    <div class="card">
      <div class="card-title">Recent Transactions</div>
      ${rows}
    </div>
  `;
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
