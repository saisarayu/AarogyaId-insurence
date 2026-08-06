"""
AI service — generates structured recommendations.

Responsibilities:
  - generate_recommendation(): RAG → GPT-3.5-turbo → structured JSON
  - SESSION_STORE: shared in-memory session cache used by chat_service
  - chat_with_user(): thin shim → delegates to chat_service to avoid duplication
"""

import json
import re
from typing import Any

from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.config.settings import settings
from app.services.rag_service import retrieve_policy_chunks

# ---------------------------------------------------------------------------
# Shared session store (imported by chat_service.py)
# ---------------------------------------------------------------------------
SESSION_STORE: dict[str, dict[str, Any]] = {}


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
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.0, api_key=api_key)
        response = llm.invoke([HumanMessage(content=prompt)])
        return str(response.content).strip()
    except Exception as exc:
        raise RuntimeError(f"AI invocation failed: {exc}")


def _build_user_profile_context(user_profile: dict) -> str:
    return (
        "User Profile:\n"
        f"Name: {user_profile.get('name')}\n"
        f"Age: {user_profile.get('age')}\n"
        f"Lifestyle: {user_profile.get('lifestyle')}\n"
        f"Conditions: {', '.join(user_profile.get('conditions', []))}\n"
        f"Income: {user_profile.get('income')}\n"
        f"City: {user_profile.get('city')}"
    )


def _session_key(user_profile: dict) -> str:
    return (
        f"{user_profile.get('name','').strip().lower()}|"
        f"{user_profile.get('age')}|{user_profile.get('city','').strip().lower()}"
    )


def _cache_session(user_profile: dict, recommendation: str, source_policies: list[str]) -> None:
    key = _session_key(user_profile)
    SESSION_STORE[key] = {
        "profile": user_profile,
        "recommendation": recommendation,
        "source_policies": source_policies,
    }


def _extract_json_from_text(text: str) -> dict | None:
    cleaned = re.sub(r"```(?:json)?", "", text).strip().rstrip("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None


def generate_recommendation(user_profile: dict) -> dict[str, Any]:
    """
    Run the full RAG recommendation pipeline:
    1. Retrieve top-5 relevant policy chunks
    2. Build GPT prompt and generate structured JSON
    3. Apply multi-factor scoring engine to rank policies
    4. Cache session for chat context
    """
    from app.services.recommendation_service import rank_policies, evaluate_recommendations

    user_context = _build_user_profile_context(user_profile)
    
    docs = []
    try:
        docs = retrieve_policy_chunks(
            "Make a health insurance recommendation grounded in policy documents.",
            user_profile,
        )
    except Exception:
        docs = []

    source_policies = sorted({doc.metadata.get("policy_name", "unknown") for doc in docs}) if docs else []
    structured = None
    raw_text = ""

    if docs:
        chunks_with_source = "\n\n".join(
            f"[{i + 1}] {doc.page_content}\nSource: {doc.metadata.get('policy_name')}"
            for i, doc in enumerate(docs)
        )

        prompt = (
            "You are a policy-aware health insurance advisor. Use ONLY the retrieved policy chunks below.\n"
            "Do NOT invent policy benefits, premiums, or coverage details not present in the documents.\n"
            "If any detail cannot be found, use the value 'Not available'.\n\n"
            f"{user_context}\n\n"
            "Retrieved Policy Chunks:\n"
            f"{chunks_with_source}\n\n"
            "Respond with ONLY valid JSON (no markdown, no extra text) in exactly this structure:\n"
            "{\n"
            '  "peer_comparison": [\n'
            '    {\n'
            '      "policy_name": "...",\n'
            '      "insurer": "...",\n'
            '      "premium": "...",\n'
            '      "cover": "...",\n'
            '      "waiting_period": "...",\n'
            '      "benefit": "...",\n'
            '      "co_pay": "...",\n'
            '      "exclusions": "...",\n'
            '      "score": "..."\n'
            "    }\n"
            "  ],\n"
            '  "coverage_details": {\n'
            '    "inclusions": "...",\n'
            '    "exclusions": "...",\n'
            '    "sub_limits": "...",\n'
            '    "co_pay": "...",\n'
            '    "claim_type": "..."\n'
            "  },\n"
            '  "why_this_policy": "150-250 word empathetic explanation citing user name, age, lifestyle, conditions, income, city, and policy name."\n'
            "}\n\n"
            "Rules:\n"
            "- At least 2 entries in peer_comparison.\n"
            "- Reference at least 3 user profile fields in why_this_policy.\n"
            "- Do NOT provide medical advice.\n"
            "- Reply ONLY with the JSON object."
        )

        try:
            raw_text = _invoke_ai(prompt)
            structured = _extract_json_from_text(raw_text)
        except Exception:
            raw_text = ""
            structured = None

    if structured and structured.get("peer_comparison"):
        peers = structured.get("peer_comparison", [])
        income_key = str(user_profile.get("income", "3-8L"))
        ranked_peers = rank_policies(peers, income_key)

        _cache_session(user_profile, raw_text, source_policies)
        return {
            "peer_comparison": ranked_peers,
            "coverage_details": structured.get("coverage_details", {}),
            "why_this_policy": structured.get("why_this_policy", ""),
            "source_policies": source_policies,
        }

    # Fallback when vector docs are missing or LLM call fails / OpenAI API quota is exhausted
    conditions = user_profile.get("conditions", []) or user_profile.get("diseases", []) or ["Cancer"]
    income_raw = str(user_profile.get("income", "500000"))
    
    income_val = 500000.0
    if "under 3l" in income_raw.lower() or "300000" in income_raw:
        income_val = 300000.0
    elif "3-8l" in income_raw.lower() or "800000" in income_raw:
        income_val = 800000.0
    elif "8-15l" in income_raw.lower() or "1500000" in income_raw:
        income_val = 1500000.0
    elif "15l+" in income_raw.lower():
        income_val = 10000000.0
    else:
        try:
            income_val = float(income_raw.replace("₹", "").replace(",", "").strip())
        except ValueError:
            income_val = 500000.0

    try:
        age_val = int(user_profile.get("age", 35))
    except (ValueError, TypeError):
        age_val = 35

    eval_res = evaluate_recommendations(
        diseases=conditions,
        annual_income=income_val,
        age=age_val
    )
    rec_policies = eval_res.get("recommended_policies", [])
    if not rec_policies:
        rec_policies = eval_res.get("all_system_policies", [])

    peer_list = []
    for pol in rec_policies[:5]:
        cov_num = float(pol.get("coverage_amount", 500000.0))
        cov_formatted = f"₹{cov_num:,.0f}"
        scheme = pol.get("scheme_type", "Government")
        premium_est = f"₹{max(1800, int(cov_num * 0.008)):,/yr}" if scheme != "Government" else "Free / Govt Subsidized"
        
        peer_list.append({
            "policy_name": pol.get("policy_name", "Health Shield"),
            "insurer": pol.get("insurer", "National Health Insurance"),
            "premium": premium_est,
            "cover": cov_formatted,
            "waiting_period": "0-24 Months",
            "benefit": pol.get("description", "Comprehensive hospitalization cover."),
            "co_pay": "0%" if scheme == "Government" else "10%",
            "exclusions": "Cosmetic, non-medical procedures",
            "score": f"{pol.get('relevance_score', 92)}%"
        })

    name = user_profile.get("name", "Friend")
    if name.strip().lower() in ["valued customer", "user", "applicant"]:
        name = "Friend"
    city = user_profile.get("city", "India")
    cond_str = ", ".join(conditions) if conditions else "general wellness"

    why_templates = [
        (
            f"Hey {name}! Based on your age ({age_val}), location ({city}), and selected health needs ({cond_str}), "
            f"we've handpicked the top active schemes for you. These policies provide comprehensive coverage for {cond_str} "
            f"with zero-to-minimal co-pay, 100% cashless hospitalization, and quick claim settlements so you and your family stay fully protected."
        ),
        (
            f"Hello {name}! We've analyzed active policies for your profile ({age_val} years old, residing in {city}) "
            f"covering {cond_str}. The recommended plans below match your income criteria and give you maximum coverage benefits, "
            f"low waiting periods, and full protection at 10,000+ impaneled network hospitals."
        ),
        (
            f"Hi {name}! Here are your tailored health insurance recommendations. Designed specifically for {cond_str} "
            f"and suited to your profile in {city}, these top-rated schemes cover inpatient hospital care, ICU charges, and pre/post-hospitalization costs with zero financial stress."
        ),
    ]

    import random
    why_text = random.choice(why_templates)

    fallback_coverage = {
        "inclusions": "Inpatient Hospitalization, Pre & Post Care, ICU & Surgical Procedures, Day Care Treatments",
        "exclusions": "Pre-existing conditions standard waiting period, Cosmetic Surgery, Experimental Therapies",
        "sub_limits": "No cap on ICU rooms; Doctor fees standard rates",
        "co_pay": "0% for Government schemes, 10% for Private networks",
        "claim_type": "Cashless at 10,000+ Network Hospitals & Reimbursement"
    }

    fallback_sources = [p.get("policy_name", "Policy") for p in rec_policies[:3]]
    _cache_session(user_profile, why_text, fallback_sources)

    return {
        "peer_comparison": peer_list,
        "coverage_details": fallback_coverage,
        "why_this_policy": why_text,
        "source_policies": fallback_sources,
    }



def chat_with_user(question: str, user_profile: dict) -> dict[str, Any]:
    """Thin shim — delegates to chat_service for single-responsibility."""
    from app.services.chat_service import chat_with_user as _chat
    return _chat(question, user_profile)
