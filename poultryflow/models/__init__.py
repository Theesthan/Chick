# Import all models so Alembic can detect them for migrations
from models.base import Base  # noqa: F401
from models.user import User  # noqa: F401
from models.farm import Farm  # noqa: F401
from models.batch import Batch  # noqa: F401
from models.procurement import Procurement  # noqa: F401
from models.inventory import InventoryTransaction  # noqa: F401
from models.daily_report import DailyReport  # noqa: F401
from models.weighing import Weighing  # noqa: F401
from models.transport import Transport  # noqa: F401
from models.processing import Processing  # noqa: F401
from models.sales import Sale  # noqa: F401
