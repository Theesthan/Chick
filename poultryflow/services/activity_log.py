"""Utility to write and read activity logs."""
import logging
from datetime import date
from sqlalchemy.orm import Session
from models.activity_log import ActivityLog

logger = logging.getLogger(__name__)


def log(
    db: Session,
    *,
    action: str,
    user_id: str | None = None,
    entity: str | None = None,
    entity_id: str | None = None,
    detail: str | None = None,
) -> None:
    try:
        entry = ActivityLog(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            detail=detail,
        )
        db.add(entry)
        db.commit()
    except Exception as exc:
        logger.warning("Failed to write activity log: %s", exc)


def list_logs(db: Session, skip: int = 0, limit: int = 100) -> list[ActivityLog]:
    return (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def daily_summary(db: Session, for_date: date | None = None) -> dict:
    """Generate a plain-text summary of today's activity for WhatsApp dispatch."""
    target = for_date or date.today()
    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.created_at >= str(target))
        .filter(ActivityLog.created_at < str(target) + "T23:59:59")
        .order_by(ActivityLog.created_at.asc())
        .all()
    )
    lines = [f"📋 PoultryFlow Daily Summary — {target.strftime('%d %b %Y')}"]
    lines.append(f"Total activities: {len(logs)}")
    for entry in logs:
        lines.append(f"• [{entry.action}] {entry.detail or ''}")
    return {"date": str(target), "count": len(logs), "summary": "\n".join(lines)}
