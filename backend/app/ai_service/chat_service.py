"""
Serviciul de asistență conversațională cu fermierul (Chat Panel).
Responsabilitate: Persoana 5 (AI & LLM Integration Engineer)
Task 5.4: Răspunsuri la întrebările fermierului despre parcela curentă,
inclusiv analiză multimodală pentru imagini și fișiere (buletine analize sol/frunze).
"""

import base64
import logging
from typing import Dict, Any, List, Optional
from app.models.schemas import ChatMessageResponse, ChatAttachment
from app.ai_service.gemini_client import ai_service
from app.ai_service.prompt_builder import SYSTEM_AGRONOMIC_PROMPT

logger = logging.getLogger(__name__)


def process_farmer_chat(
    parcel_id: str,
    user_message: str,
    parcel_context: Optional[Dict[str, Any]] = None,
    attachments: Optional[List[ChatAttachment]] = None,
) -> ChatMessageResponse:
    """
    Răspunde interactiv la întrebările fermierului având în context datele parcelei,
    precum și eventuale imagini sau fișiere încărcate (analize de laborator, foto culturi).
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
            from google.genai import types

            contents_list: List[Any] = []
            files_annotation = ""

            # Procesare fișiere atașate (imagini, PDF-uri, texte de laborator)
            if attachments:
                files_annotation = "\n[Fișiere atașate de fermier]:\n"
                for att in attachments:
                    try:
                        raw_data = base64.b64decode(att.data_base64)
                        ctype = (att.content_type or "").lower()

                        if ctype.startswith("image/") or ctype == "application/pdf":
                            part = types.Part.from_bytes(data=raw_data, mime_type=ctype)
                            contents_list.append(part)
                            files_annotation += f"- Atașament vizual/document: '{att.name}' ({ctype})\n"
                        elif "text" in ctype or "csv" in ctype or att.name.endswith((".csv", ".txt")):
                            text_body = raw_data.decode("utf-8", errors="ignore")
                            files_annotation += f"- Document text '{att.name}':\n```\n{text_body[:4000]}\n```\n"
                    except Exception as parse_err:
                        logger.warning(f"Nu s-a putut decoda atașamentul '{att.name}': {parse_err}")

            multimodal_instructions = (
                "\n\nInstrucțiuni agronomice speciale pentru fișiere atașate:\n"
                "Dacă fermierul a trimis o imagine a unui buletin de analiză de laborator (sol, apă, țesut vegetal/frunză):\n"
                "1. Extrage cu acuratețe parametrii cheie detectați (pH, humus/materie organică %, NPK - Azot, Fosfor mobil P2O5, Potasiu K2O, microelemente etc.).\n"
                "2. Evaluează nivelul fiecărui parametru (foarte scăzut, optim, excesiv) în contextul solurilor din Republica Moldova.\n"
                "3. Formulează un plan concret de fertilizare sau corectare pas cu pas.\n"
                "Dacă fermierul a trimis o fotografie cu frunze sau culturi, identifică posibilele simptome de boli fungice/bacteriene, deficiențe nutriționale sau atac de dăunători."
            )

            full_prompt = (
                f"{context_summary}\n"
                f"{files_annotation}\n"
                f"Mesajul fermierului: {user_message}\n"
                f"{multimodal_instructions}\n\n"
                f"Răspunde structurat, clar și profesionist, pe înțelesul unui agricultor practicant."
            )

            contents_list.append(full_prompt)

            response = client.models.generate_content(
                model=ai_service.model_name,
                contents=contents_list,
                config={
                    "system_instruction": SYSTEM_AGRONOMIC_PROMPT,
                    "temperature": 0.4,
                }
            )
            if response.text:
                if attachments and not user_message.strip():
                    suggested = [
                        "Ce plan de fertilizare recomandat reiese din acest buletin?",
                        "Este necesară amendarea cu var sau gips a acestui sol?",
                        "Ce culturi valorifică cel mai bine acești parametri pedologici?"
                    ]
                return ChatMessageResponse(reply=response.text, suggested_questions=suggested)
        except Exception as e:
            logger.error(f"Eroare Gemini Chat Multimodal API: {e}", exc_info=True)
    else:
        logger.warning("Gemini Client este None în chat_service!")

    # Răspuns ghidat local inteligent (pentru dezvoltare fără cheie API)
    if attachments:
        reply = (
            f"Am recepționat {len(attachments)} fișier(e) atașat(e) ({', '.join(a.name for a in attachments)}). "
            f"În modul live cu Google Gemini conectat, valorile din buletinul de analiză de laborator sau fotografiile culturii "
            f"vor fi interpretate automat pentru parcela {parcel_id}."
        )
        return ChatMessageResponse(reply=reply, suggested_questions=suggested)

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
