from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Integer,
    Text,
    TIMESTAMP,
    ForeignKey
)
from sqlalchemy.sql import func

from app.database.connection import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    contract_name = Column(
        String(255),
        nullable=False
    )

    file_name = Column(
        String(255),
        nullable=False
    )

    file_type = Column(
        String(50)
    )

    version_number = Column(
        Integer,
        default=1
    )

    parent_contract_id = Column(
        BigInteger,
        ForeignKey(
            "contracts.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    uploaded_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )


class Clause(Base):
    __tablename__ = "clauses"

    id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    contract_id = Column(
        BigInteger,
        ForeignKey(
            "contracts.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    clause_number = Column(
        String(100)
    )

    clause_title = Column(
        String(255)
    )

    clause_text = Column(
        Text,
        nullable=False
    )

    page_number = Column(
        Integer
    )

    created_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )