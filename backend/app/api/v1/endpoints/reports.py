"""
Rute pentru generare și descărcare rapoarte executive.
"""

from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from app.models.schemas import ParcelAnalysisResponse
from app.ai_service.report_generator import generate_executive_html_report

router = APIRouter()


@router.post("/html", response_class=HTMLResponse, summary="Generează raport imprimabil HTML/PDF")
async def generate_report_view(analysis: ParcelAnalysisResponse):
    """Returnează o pagină web optimizată pentru tipărire sau salvare ca PDF."""
    html_content = generate_executive_html_report(analysis)
    return HTMLResponse(content=html_content, status_code=200)
