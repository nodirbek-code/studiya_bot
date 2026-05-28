"""
Studio Router — studiya ma'lumotlari (public)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from models.models import StudioInfo
from schemas.catalog import StudioInfoOut
from security.auth import get_admin_user
from models.models import User

router = APIRouter()


@router.get("", response_model=StudioInfoOut)
async def get_info(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StudioInfo).limit(1))
    info = result.scalar_one_or_none()
    if not info:
        raise HTTPException(status_code=404, detail="Studiya ma'lumoti kiritilmagan")
    return info


@router.put("")
async def update_info(
    data: StudioInfoOut,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = await db.execute(select(StudioInfo).limit(1))
    info = result.scalar_one_or_none()
    if not info:
        info = StudioInfo()
        db.add(info)
    for k, v in data.model_dump(exclude_none=False).items():
        setattr(info, k, v)
    await db.commit()
    return {"message": "Studiya ma'lumoti yangilandi"}
