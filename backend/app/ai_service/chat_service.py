"""
Serviciul de asistență conversațională cu fermierul (Chat Panel).
Responsabilitate: Persoana 5 (AI & LLM Integration Engineer)
Task 5.4: Răspunsuri la întrebările fermierului despre parcela curentă.
"""

from typing import Dict, Any, List, Optional
from app.models.schemas import ChatMessageResponse
from app.ai_service.gemini_client import ai_service
from app.ai_service.prompt_builder import SYSTEM_AGRONOMIC_PROMPT


def process_farmer_chat(
    parcel_id: str,
    user_message: str,
    parcel_context: Optional[Dict[str, Any]] = None
) -> ChatMessageResponse:
    """
    Răspunde interactiv la întrebările fermierului având în context datele parcelei.
    """
    context_summary = ""
    if parcel_context:
        soil = parcel_context.get("soil_profile", {})
        climate = parcel_context.get("climate_telemetry", {})
        context_summary = (
            f"Context parcelă ID {parcel_id}: Sol {soil.get('type')}, Bonitate {soil.get('bonitate_points')}p, "
            f"pH {soil.get('ph')}, Umiditate sol {climate.get('soil_moisture_pct')}%, "
            f"Precipitații 30z: {climate.get('precipitation_last_30d_mm')} mm."
        )

    suggested = [
        "Ce cantitate de azot (N) este recomandată la semănat?",
        "Cum mă protejez împotriva secetei dacă umiditatea scade?",
        "Ce asolament (rotație a culturilor) recomanzi pentru anul viitor?"
    ]

    # Dacă Gemini API este conectat:
    client = ai_service.get_client()
    if client:
        try:
            full_prompt = f"{context_summary}\n\nÎntrebarea fermierului: {user_message}\n\nRăspunde scurt, la obiect, pe înțelesul unui agricultor."
            response = client.models.generate_content(
                model=ai_service.model_name,
                contents=full_prompt,
                config={
                    "system_instruction": SYSTEM_AGRONOMIC_PROMPT,
                    "temperature": 0.4
                }
            )
            if response.text:
                return ChatMessageResponse(reply=response.text, suggested_questions=suggested)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Eroare Gemini Chat API: {e}", exc_info=True)
    else:
        import logging
        logging.getLogger(__name__).warning("Gemini Client este None în chat_service!")

    # Răspuns ghidat local inteligent (pentru dezvoltare fără cheie API)
    msg_lower = user_message.lower()
    if "azot" in msg_lower or "ingrasamant" in msg_lower or "fertiliz" in msg_lower:
        reply = (
            "Pentru solul parcelei tale, având în vedere rezerva de humus, se recomandă aplicarea fracționată a azotului: "
            "o treime la pregătirea patului germinativ (ex: complex NPK 16:16:16) și două treimi în vegetație, "
            "pentru a evita pierderile prin volatilizare sau levigare."
        )
    elif "secet" in msg_lower or "apa" in msg_lower or "umiditate" in msg_lower:
        reply = (
            "Având în vedere deficitul de umiditate din sol, recomandăm lucrări minime ale solului (No-Till sau Strip-Till) "
            "pentru a păstra capilaritatea apei, semănatul la adâncimea optimă de umiditate și folosirea de hibrizi cu toleranță genetică ridicată la secetă."
        )
    elif "asolament" in msg_lower or "rotati" in msg_lower:
        reply = (
            "Pentru menținerea fertilității solului din Moldova, nu cultiva floarea-soarelui pe aceeași parcelă mai des de o dată la 5-6 ani! "
            "O rotație excelentă ar fi: Grâu de toamnă -> Floarea-soarelui -> Porumb sau Soia -> Orz."
        )
    else:
        reply = (
            f"Analizând datele parcelei {parcel_id}, recomandăm adaptarea tehnologiei agricole la bonitatea solului "
            f"și menținerea unui echilibru strict între fertilizare și rezerva de apă din profilul solului."
        )

    return ChatMessageResponse(reply=reply, suggested_questions=suggested)
