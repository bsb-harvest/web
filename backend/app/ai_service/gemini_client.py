"""
Client Google Gemini API cu suport pentru Structured Outputs și Fallback Inteligent.
Responsabilitate: Persoana 5 (AI & LLM Integration Engineer)
Task 5.1: Generare răspuns structurat garantat conform AIGuidance.
"""

import json
import logging
from typing import List, Optional
from app.core.config import settings
from app.models.schemas import SoilProfile, ClimateTelemetry, RecommendedCrop, AIGuidance
from app.ai_service.disease_detector import detect_phytosanitary_risks
from app.ai_service.prompt_builder import SYSTEM_AGRONOMIC_PROMPT, build_analysis_prompt

logger = logging.getLogger(__name__)


class GeminiAIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        self.get_client()

    def get_client(self):
        if not self._client:
            api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
            if not api_key:
                from dotenv import load_dotenv
                load_dotenv(".env")
                load_dotenv("../.env")
                api_key = os.getenv("GEMINI_API_KEY", "")
                if api_key:
                    settings.GEMINI_API_KEY = api_key

            if api_key:
                try:
                    from google import genai
                    self.api_key = api_key
                    self.model_name = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
                    self._client = genai.Client(api_key=self.api_key)
                    logger.info(f"Gemini Client inițializat cu succes (model: {self.model_name})")
                except Exception as e:
                    logger.warning(f"Nu s-a putut inițializa clientul google-genai: {e}. Se folosește fallback.")
        return self._client

    def generate_guidance(
        self,
        soil: SoilProfile,
        climate: ClimateTelemetry,
        crops: List[RecommendedCrop],
        area_ha: float
    ) -> AIGuidance:
        """
        Generează recomandarea agronomică AI folosind Gemini API dacă este configurat,
        sau modulul expert determinist dacă nu este setată cheia.
        """
        detected_risks = detect_phytosanitary_risks(soil, climate)
        prompt = build_analysis_prompt(soil, climate, crops, area_ha, detected_risks)

        client = self.get_client()
        if client:
            try:
                # Utilizare Google Gemini SDK cu Structured Output
                response = client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config={
                        "system_instruction": SYSTEM_AGRONOMIC_PROMPT,
                        "response_mime_type": "application/json",
                        "response_schema": AIGuidance,
                        "temperature": 0.3,
                    }
                )
                if response.text:
                    data = json.loads(response.text)
                    return AIGuidance(**data)
            except Exception as e:
                logger.error(f"Eroare la apelul Gemini API: {e}. Se trece pe fallback.")

        # Fallback Inteligent și Determinist (Zero-Crash chiar dacă nu există API KEY)
        best_crop = crops[0] if crops else None
        best_crop_name = best_crop.crop_name if best_crop else "Floarea-soarelui"
        
        summary = (
            f"Solul din tipul {soil.type} are o notă de bonitate de {soil.bonitate_points} puncte, "
            f"indicând un potențial agronomic valoros. În condițiile actuale de umiditate ({climate.soil_moisture_pct}%), "
            f"cultura de {best_crop_name} oferă cel mai avantajos raport randament/investiție."
        )

        actionable_steps = [
            f"Semănat timpurie a culturii de {best_crop_name} pentru a valorifica rezerva de apă de primăvară.",
            "Efectuarea unei fertilizări fracționate cu NPK, ținând cont de conținutul de humus de " + str(soil.humus_pct) + "%.",
            "Monitorizarea umidității din sol la adâncimea de 20-40 cm înainte de aplicarea erbicidelor preemergente."
        ]

        if climate.leaf_wetness_hours > 4.0:
            actionable_steps.append("Efectuarea unui tratament fungic preventiv în următoarele 48 de ore.")

        return AIGuidance(
            summary=summary,
            risks=detected_risks,
            actionable_steps=actionable_steps
        )


ai_service = GeminiAIService()
