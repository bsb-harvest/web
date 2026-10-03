"""
Pachetul AI Service — Google Gemini API, analiza riscurilor fitosanitare și rapoarte.
Persoana 5: AI & LLM Integration Engineer
"""

from app.ai_service.gemini_client import ai_service, GeminiAIService
from app.ai_service.disease_detector import detect_phytosanitary_risks
from app.ai_service.prompt_builder import SYSTEM_AGRONOMIC_PROMPT, build_analysis_prompt
from app.ai_service.chat_service import process_farmer_chat
from app.ai_service.report_generator import generate_executive_html_report

__all__ = [
    "ai_service",
    "GeminiAIService",
    "detect_phytosanitary_risks",
    "SYSTEM_AGRONOMIC_PROMPT",
    "build_analysis_prompt",
    "process_farmer_chat",
    "generate_executive_html_report",
]
