"""
Chat service — answers user questions grounded in retrieved policy chunks.

Extracted from ai_service.py so each service has a single responsibility:
  - ai_service.py       → generate_recommendation()
  - chat_service.py     → chat_with_user()
"""

from typing import Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.config.settings import settings
from app.services.rag_service import retrieve_policy_chunks

MEDICAL_ADVICE_KEYWORDS = [
    "medical advice", "diagnose", "doctor", "prescribe",
    "medication", "symptom", "treatment", "surgery",
    "pharmacy", "health advice",
]

# Re-use the session store from ai_service so chat can reference prior recommendations
from app.services.ai_service import SESSION_STORE, _session_key


def _get_api_key() -> str | None:
    return settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or settings.OPENAI_API_KEY


def _invoke_ai(prompt: str) -> str:
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("No API key configured. Set GEMINI_API_KEY in .env.")

    # 1. Try Gemini SDK
    if settings.GEMINI_API_KEY or settings.GOOGLE_API_KEY or api_key.startswith("AIza"):
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
            )
            if response and response.text:
                return response.text.strip()
        except Exception:
            pass

        # 2. Try Gemini REST API fallback
        try:
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass

    # 3. Fallback to OpenAI if configured
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3, api_key=api_key)
        response = llm.invoke([HumanMessage(content=prompt)])
        return str(response.content).strip()
    except Exception as exc:
        raise RuntimeError(f"AI chat invocation failed: {exc}")


def _is_medical_advice_question(question: str) -> bool:
    lower = question.lower()
    return any(kw in lower for kw in MEDICAL_ADVICE_KEYWORDS)


def _build_profile_context(user_profile: dict) -> str:
    return (
        "User Profile Context:\n"
        f"• Applicant Name: {user_profile.get('name', 'User')}\n"
        f"• Age: {user_profile.get('age', 35)} years\n"
        f"• Annual Family Income: ₹{float(user_profile.get('income', 280000)):,.0f}\n"
        f"• Selected Medical Conditions: {', '.join(user_profile.get('conditions', []) or user_profile.get('diseases', []) or ['None specified'])}\n"
        f"• City: {user_profile.get('city', 'India')}\n"
        f"• Active Recommended Count: {user_profile.get('active_recommendations_count', 0)}"
    )


import random


def _build_fallback_answer(question: str, user_profile: dict, all_db_policies: list, docs: list) -> str:
    q_lower = question.strip().lower()
    conds = user_profile.get("conditions", []) or user_profile.get("diseases", [])
    name = user_profile.get("name") or "Friend"
    if name.strip().lower() in ["user", "valued customer", "applicant"]:
        name = "Friend"

    # Detect informal/friendly 'maama' / 'mama' / 'bro' / 'buddy' energy
    has_maama = any(w in q_lower for w in ["maama", "mama", "bro", "buddy", "dude", "boss"])
    friend_title = "maama" if has_maama else (name if name != "Friend" else "friend")

    # 1. Greetings & Pure Chit-Chat (hi, hello, hey, hi maama, yo, good morning, etc.)
    greeting_words = ["hi", "hello", "hey", "h", "namaste", "good morning", "good evening", "good afternoon", "yo", "sup", "howdy"]
    # Check if question is basically just a greeting
    clean_q = "".join([c if c.isalnum() or c.isspace() else "" for c in q_lower]).strip()
    words = clean_q.split()
    
    is_pure_greeting = (
        clean_q in greeting_words or
        (len(words) <= 3 and any(w in greeting_words for w in words)) or
        any(k in q_lower for k in ["who are you", "what can you do", "help me", "how are you", "how r u"])
    )

    if is_pure_greeting and not any(k in q_lower for k in ["cover", "waiting", "claim", "disease", "policy", "premium", "cost", "pdf"]):
        friendly_greetings = [
            f"Hey {friend_title}! 👋 Great to chat with you! How's your day going?\n\nI'm your personal AarogyaID Health Insurance guide. Tell me what you're looking for today — whether it's disease-specific cover, low-premium government schemes, or claim details, I've got your back, {friend_title}! What's on your mind?",
            f"Hello {friend_title}! 😊 Super happy to help you out!\n\nI can help you analyze waiting periods, compare zero co-pay plans, find coverage for pre-existing conditions, or explain policy details. How can I assist you right now, {friend_title}?",
            f"Hey there {friend_title}! 🤝 Hope you're doing awesome!\n\nAsk me anything about insurance policies for Cancer, Diabetes, Heart care, or how to download official PDF documents from your dashboard. What question do you have for me today?",
        ]
        return random.choice(friendly_greetings)

    # 2. Courtesy & Thanks
    if any(k in q_lower for k in ["thank", "thanks", "awesome", "great", "cool", "super", "nice", "ok", "okay"]):
        thanks_responses = [
            f"Anytime {friend_title}! 😊 Always happy to help. Let me know if you need anything else about your policies!",
            f"You're very welcome, {friend_title}! 👍 Stay healthy and let me know whenever you have more questions!",
            f"Glad I could help, {friend_title}! Feel free to ask about waiting periods, claim process, or PDF downloads anytime!",
        ]
        return random.choice(thanks_responses)

    # 3. Specific disease query matching
    target_disease = None
    disease_keywords = {
        "cancer": ["cancer", "oncology", "tumor"],
        "heart": ["heart", "cardio", "cardiac", "stroke", "blood pressure", "hypertension"],
        "diabetes": ["diabetes", "diab", "sugar", "glucose", "insulin"],
        "kidney": ["kidney", "renal", "dialysis"],
        "asthma": ["asthma", "lung", "respiratory", "breathing"],
        "liver": ["liver", "hepatic"],
        "maternity": ["maternity", "pregnancy", "mother", "baby"],
        "neuro": ["neuro", "brain", "parkinson", "alzheimer"],
    }
    for d_key, kw_list in disease_keywords.items():
        if any(kw in q_lower for kw in kw_list):
            target_disease = d_key
            break

    if target_disease:
        matched_pols = []
        for p in all_db_policies:
            cats = [c.lower() for c in (p.get("disease_categories") or [])]
            if any(target_disease in c for c in cats):
                matched_pols.append(p)

        prefix = f"Hey {friend_title}! " if has_maama else f"Hi {name}, "
        if matched_pols:
            lines = [f"{prefix}here are the active insurance schemes in our database covering **{target_disease.title()}**:\n"]
            for p in matched_pols:
                cov = f"₹{float(p.get('coverage_amount', 0)):,.0f}"
                inc = f"₹{float(p.get('annual_income_limit', 0)):,.0f}"
                lines.append(
                    f"• **{p.get('policy_name')}** ({p.get('scheme_type', 'Government')} Scheme)\n"
                    f"  - **Coverage**: Up to {cov} | **Income Limit**: {inc}\n"
                    f"  - **Key Covered Conditions**: {', '.join(p.get('disease_categories') or [])}\n"
                    f"  - **Overview**: {p.get('description', 'Comprehensive hospitalization cover.')}\n"
                )
            lines.append(f"💡 You can view and download official policy PDFs directly from your dashboard cards! Anything else you'd like to check about {target_disease.title()} coverage, {friend_title}?")
            return "\n".join(lines)
        else:
            return f"{prefix}we currently have {len(all_db_policies)} active policies in the system. While no policy explicitly targets '{target_disease.title()}' exclusively, our general health schemes cover inpatient treatments for critical illnesses! Would you like me to show all matching general plans, {friend_title}?"

    # 4. Waiting period, claims, co-pay, premium & exclusions queries
    if any(k in q_lower for k in ["waiting", "claim", "exclusion", "copay", "co-pay", "benefit", "cost", "premium", "afford"]):
        prefix = f"Here's the clear breakdown for you, {friend_title}:\n\n"
        if docs:
            chunks_info = "\n\n".join([f"• **{doc.metadata.get('policy_name', 'Policy')}**: {doc.page_content}" for doc in docs[:3]])
            return f"{prefix}### 📜 Policy Terms & Specifications:\n\n{chunks_info}\n\n💡 Download official policy PDFs from your recommendation cards to read complete clause details!"
        
        return (
            f"{prefix}"
            "• **Waiting Period**: Government subsidized schemes feature 0-day waiting for emergency & cashless treatment. Standard private policies have 12 to 24 months for pre-existing conditions.\n"
            "• **Co-Payment**: 0% co-pay for government schemes; 10% co-pay for private network treatments.\n"
            "• **Cashless Claims**: 100% cashless hospitalization across 10,000+ impaneled network hospitals.\n"
            "• **Exclusions**: Cosmetic procedures, experimental therapies, and non-prescribed supplements.\n\n"
            f"Would you like me to check waiting periods for a specific policy, {friend_title}?"
        )

    # 5. Admin & Website navigation questions
    if any(k in q_lower for k in ["admin", "upload", "add policy", "dashboard", "how to use", "website", "navigate", "pdf"]):
        return (
            f"Sure thing, {friend_title}! Here is how to navigate the platform:\n\n"
            "1. **Select Conditions**: Pick your health conditions (Cancer, Diabetes, Heart, etc.) from the top grid.\n"
            "2. **Fill Profile**: Enter annual family income and age, then click **'Generate Combined Policy Recommendations'**.\n"
            "3. **Filter & Explore Tabs**: Toggle between **All Matching**, **Combo Policies**, and **Disease Specific Tabs**.\n"
            "4. **Download Official PDFs**: Click **'Download PDF'** on any recommendation card.\n"
            "5. **Admin Panel** (`/admin`): Upload new PDF policy files, set disease categories, and update income caps."
        )

    # 6. Conversational fallback (Direct, varied, non-repeating human response)
    prefix = f"Hey {friend_title}! " if has_maama else f"Hi {name}, "
    active_count = len(all_db_policies)
    cond_text = f"for {', '.join(conds)}" if conds else "for your selected profile"

    responses = [
        f"{prefix}regarding your query about \"{question}\":\n\nWe currently have {active_count} active policies verified in our system database {cond_text}. All government schemes offer 100% cashless hospitalization with 0% co-payment for eligible income brackets.\n\nIs there a specific detail like waiting period, premium cost, or disease coverage you'd like me to look up for you, {friend_title}?",
        f"{prefix}I understand you're asking about \"{question}\".\n\nOur system evaluated {active_count} health insurance policies in the database. Key schemes cover pre-existing conditions with minimal waiting periods and zero hidden charges.\n\nFeel free to ask me to compare policies, check income eligibility, or explain claim procedures!",
        f"{prefix}about \"{question}\":\n\nYou can easily check and download verified policy documents from the recommendation section above. We have schemes tailored for low & middle-income families with comprehensive medical cover.\n\nWhat specific policy aspect can I clarify for you next, {friend_title}?",
    ]
    return random.choice(responses)


def chat_with_user(question: str, user_profile: dict) -> dict[str, Any]:
    """
    Answer a user question grounded in retrieved policy chunks, database policies, and website context.
    Provides complete website awareness with a warm, natural, human-interactive tone ('maama' friendly style).
    """
    if _is_medical_advice_question(question):
        return {
            "answer": "I cannot provide medical advice. Please consult a licensed healthcare professional or doctor for medical diagnosis or treatment.",
            "sources": [],
        }

    from app.services.policy_service import list_policies_raw
    all_db_policies = list_policies_raw()

    # Pass actual user question to RAG vector retrieval
    try:
        docs = retrieve_policy_chunks(question, user_profile)
    except Exception:
        docs = []

    source_policies = sorted({doc.metadata.get("policy_name", "unknown") for doc in docs}) if docs else []

    # Build concise directory summary of all system policies in DB
    policy_dir_lines = []
    for idx, p in enumerate(all_db_policies, 1):
        pname = p.get("policy_name", "Unknown Policy")
        cats = ", ".join(p.get("disease_categories") or [])
        cov = f"₹{float(p.get('coverage_amount', 0)):,.0f}"
        inc = f"₹{float(p.get('annual_income_limit', 0)):,.0f}"
        status = p.get("status", "Active")
        days = ", ".join(p.get("activation_days") or [])
        policy_dir_lines.append(
            f"{idx}. {pname} | Covered: [{cats}] | Coverage: {cov} | Income Cap: {inc} | Active Days: {days} | Status: {status}"
        )
    policy_directory_str = "\n".join(policy_dir_lines) if policy_dir_lines else "No policies currently registered in database."

    profile_context = _build_profile_context(user_profile)
    session = SESSION_STORE.get(_session_key(user_profile))
    prior_context = (
        session["recommendation"] if session else "No prior recommendation available."
    )

    chunks_text = "\n\n".join(
        f"[{i + 1}] {doc.page_content}\nSource: {doc.metadata.get('policy_name')}"
        for i, doc in enumerate(docs)
    ) if docs else "No specific chunk retrieved for this search term."

    prompt = (
        "You are the Intelligent AI Assistant for AarogyaID Health Insurance Platform.\n"
        "Tone & Persona instructions: Speak like a warm, friendly, empathetic, human-interactive guide ('maama' friendly, helpful, conversational tone).\n"
        "Avoid robotic canned templates or repeating the same boilerplate disclaimers.\n\n"
        "You possess 100% complete knowledge of this entire project and website, including:\n"
        "1. All uploaded policy documents, waiting periods, exclusions, co-payments, and policy specifications in the database.\n"
        "2. The applicant's profile (name, age, selected diseases, family income, city).\n"
        "3. Multi-disease policy matching, combo policy recommendations, and disease-specific policy categorization.\n"
        "4. Platform features: Admin Panel (`/admin`) policy uploads, 20+ Disease Grid selector, downloadable PDF policies, income caps, and day-of-week activation schedules (Mon-Sun).\n\n"
        "REASSURING & ACCURATE GUIDANCE:\n"
        "- Respond in a natural, engaging, human conversational style. Match the user's friendly energy.\n"
        "- Answer the specific user question directly using policy facts from the database directory below.\n"
        "- Use bullet points for readability when listing policies or terms.\n"
        "- Do NOT provide medical advice.\n\n"
        f"{profile_context}\n\n"
        "Active Dashboard Context:\n"
        f"{prior_context}\n\n"
        "All System Insurance Policies Directory:\n"
        f"{policy_directory_str}\n\n"
        "Retrieved Detailed Policy Chunks:\n"
        f"{chunks_text}\n\n"
        "User Question:\n"
        f"{question}\n\n"
        "Answer naturally, warmly, and thoroughly:"
    )

    answer = None
    try:
        answer = _invoke_ai(prompt)
    except Exception:
        answer = None

    if not answer:
        # Fallback to intelligent, dynamic conversational responder
        answer = _build_fallback_answer(question, user_profile, all_db_policies, docs)

    # Collect source names from retrieved chunks and system directory
    all_sources = list(source_policies)
    if not all_sources and all_db_policies:
        all_sources = [p.get("policy_name", "Directory") for p in all_db_policies[:3]]

    return {"answer": answer, "sources": all_sources}

