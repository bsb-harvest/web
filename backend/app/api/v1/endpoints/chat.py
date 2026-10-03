"""
Rute pentru Asistentul Conversațional Agronomic AI.
"""

from fastapi import APIRouter
from app.models.schemas import ChatMessageRequest, ChatMessageResponse
from app.ai_service.chat_service import process_farmer_chat

router = APIRouter()


@router.post("/", response_model=ChatMessageResponse, summary="Întreabă asistentul agronomic AI despre parcelă")
async def chat_with_advisor(request: ChatMessageRequest):
    """
    Răspunde interactiv la întrebările fermierului despre lucrări,
    fertilizare, riscuri sau asolament, având datele parcelei în memorie.
    """
    return process_farmer_chat(
        parcel_id=request.parcel_id,
        user_message=request.message,
        parcel_context=request.context
    )
