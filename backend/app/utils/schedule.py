from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Iterable, List, Optional

from dateutil.relativedelta import relativedelta


def _as_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _as_date(value: date | datetime) -> date:
    if isinstance(value, datetime):
        return value.date()
    return value


def expand_appointments(
    appointments: Iterable,
    *,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> List[dict]:
    """Expand recurring appointments into concrete occurrences within [start, end]."""
    now = datetime.now(timezone.utc)
    window_start = _as_aware(start or now)
    window_end = _as_aware(end or (now + relativedelta(months=3)))

    occurrences: List[dict] = []
    for appt in appointments:
        base = _as_aware(appt.datetime)
        repeat = (appt.repeat or "none").lower()
        ends_on = appt.ends_on

        cursor = base
        # Walk forward from the original datetime until past the window
        # Cap iterations to avoid runaway loops
        for _ in range(400):
            if ends_on and _as_date(cursor) > ends_on:
                break
            if cursor > window_end:
                break
            if cursor >= window_start:
                item = appt.to_dict()
                item["occurrence_datetime"] = cursor.isoformat()
                occurrences.append(item)

            if repeat in ("", "none", "once"):
                break
            if repeat == "weekly":
                cursor = cursor + timedelta(weeks=1)
            elif repeat == "monthly":
                cursor = cursor + relativedelta(months=1)
            else:
                break

    occurrences.sort(key=lambda x: x["occurrence_datetime"])
    return occurrences


def expand_prescription_refills(
    prescriptions: Iterable,
    *,
    start: Optional[date] = None,
    end: Optional[date] = None,
) -> List[dict]:
    """Expand refill schedules into concrete refill dates within [start, end]."""
    today = datetime.now(timezone.utc).date()
    window_start = start or today
    window_end = end or (today + relativedelta(months=3))

    occurrences: List[dict] = []
    for rx in prescriptions:
        refill_on = _as_date(rx.refill_on)
        schedule = (rx.refill_schedule or "monthly").lower()
        cursor = refill_on

        for _ in range(400):
            if cursor > window_end:
                break
            if cursor >= window_start:
                item = rx.to_dict()
                item["occurrence_date"] = cursor.isoformat()
                occurrences.append(item)

            if schedule in ("", "none", "once"):
                break
            if schedule == "weekly":
                cursor = cursor + timedelta(weeks=1)
            elif schedule == "monthly":
                cursor = cursor + relativedelta(months=1)
            else:
                break

    occurrences.sort(key=lambda x: x["occurrence_date"])
    return occurrences
