#!/usr/bin/env python3
"""
Pull latest data from Monarch Money and write to data/finance.json.
Run from the repo root: python3 scripts/refresh_finance.py

Credentials are read from a .env file in the repo root:
  MONARCH_EMAIL=you@example.com
  MONARCH_PASSWORD=yourpassword

Session token is cached in .monarch_session so re-auth is infrequent.
"""

import asyncio
import json
import os
import sys
from datetime import datetime, date
from pathlib import Path

# Load .env from repo root
root = Path(__file__).parent.parent
env_path = root / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

try:
    from monarchmoney import MonarchMoney
except ImportError:
    print("monarchmoney not installed. Run: pip install monarchmoney")
    sys.exit(1)


SESSION_FILE = root / ".monarch_session"
DATA_FILE = root / "data" / "finance.json"


async def main():
    email = os.environ.get("MONARCH_EMAIL")
    password = os.environ.get("MONARCH_PASSWORD")
    if not email or not password:
        print("Missing MONARCH_EMAIL or MONARCH_PASSWORD in .env")
        sys.exit(1)

    mm = MonarchMoney(session_file=str(SESSION_FILE))

    try:
        await mm.load_session(SESSION_FILE)
        print("Reusing cached session.")
    except Exception:
        print("No valid session — logging in...")
        mfa_secret = os.environ.get("MONARCH_MFA_SECRET")
        mfa_code = os.environ.get("MONARCH_MFA_CODE")
        try:
            await mm.login(email, password, mfa_secret_key=mfa_secret)
        except Exception as e:
            if "MFA" in str(e) or "mfa" in str(e).lower():
                if mfa_code:
                    await mm.multi_factor_authenticate(email, password, mfa_code)
                else:
                    code = input("Monarch MFA code: ").strip()
                    await mm.multi_factor_authenticate(email, password, code)
            else:
                raise
        await mm.save_session(SESSION_FILE)
        print("Session saved.")

    print("Fetching accounts...")
    accounts_raw = await mm.get_accounts()

    print("Fetching cashflow summary...")
    today = date.today()
    cashflow_raw = await mm.get_cashflow_summary(
        start_date=today.replace(day=1).isoformat(),
        end_date=today.isoformat(),
    )

    print("Fetching recent transactions...")
    transactions_raw = await mm.get_transactions(limit=50)

    # --- Transform accounts ---
    accounts = []
    net_worth_assets = 0.0
    net_worth_liabilities = 0.0

    for acct in accounts_raw.get("accounts", []):
        balance = acct.get("currentBalance") or 0.0
        is_liability = acct.get("isLiability", False)
        include = acct.get("includeInNetWorth", True)

        if include:
            if is_liability:
                net_worth_liabilities += abs(balance)
            else:
                net_worth_assets += balance

        accounts.append({
            "id": acct.get("id"),
            "name": acct.get("displayName") or acct.get("name"),
            "institution": (acct.get("institution") or {}).get("name"),
            "type": acct.get("type", {}).get("name"),
            "balance": balance,
            "isLiability": is_liability,
            "includeInNetWorth": include,
        })

    net_worth = round(net_worth_assets - net_worth_liabilities, 2)

    # --- Transform cashflow ---
    summary = cashflow_raw.get("summary", [{}])[0] if cashflow_raw.get("summary") else {}
    cashflow = {
        "month": today.replace(day=1).isoformat(),
        "income": round(summary.get("sumIncome", 0.0), 2),
        "expenses": round(abs(summary.get("sumExpense", 0.0)), 2),
        "net": round(summary.get("savings", 0.0), 2),
        "savingsRate": round(summary.get("savingsRate", 0.0), 4),
    }

    # --- Transform transactions ---
    transactions = []
    for txn in (transactions_raw.get("allTransactions", {}).get("results") or [])[:50]:
        transactions.append({
            "id": txn.get("id"),
            "date": txn.get("date"),
            "merchant": (txn.get("merchant") or {}).get("name") or txn.get("plaidName"),
            "amount": round(txn.get("amount", 0.0), 2),
            "category": (txn.get("category") or {}).get("name"),
            "account": (txn.get("account") or {}).get("displayName"),
            "pending": txn.get("pending", False),
        })

    # --- Write output ---
    output = {
        "lastRefreshed": datetime.utcnow().isoformat() + "Z",
        "netWorth": {
            "total": round(net_worth, 2),
            "assets": round(net_worth_assets, 2),
            "liabilities": round(net_worth_liabilities, 2),
        },
        "accounts": accounts,
        "cashflow": cashflow,
        "recentTransactions": transactions,
    }

    DATA_FILE.write_text(json.dumps(output, indent=2))
    print(f"Wrote {DATA_FILE}")
    print(f"Net worth: ${net_worth:,.2f}")
    print(f"Cashflow this month: income ${cashflow['income']:,.2f} / expenses ${cashflow['expenses']:,.2f}")


asyncio.run(main())
