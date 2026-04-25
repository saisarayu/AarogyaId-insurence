"""
AI service — generates structured recommendations and handles chat.

Key changes:
- llm.predict() (removed in langchain-openai v0.2+) replaced with llm.invoke()
- Recommendation prompt now requests JSON output with 3 structured sections
- JSON is parsed server-side; raw text is returned as fallback on parse failure
- This means the frontend receives typed keys (peer_comparison, coverage_details,
  why_this_policy) directly, fixing the blank table / coverage card bug
"""

import json
import re
from typing import Any

from langchain_core.messages import HumanMessage

from app.config.settings import settings
from app.services.rag_service import retrieve_policy_chunks
from langchain_openai import ChatOpenAI

# Simple in-memory session store for user chat context.
SESSION_STORE: dict[str, dict[str, Any]] = {}

MEDICAL_ADVICE_KEYWORDS = [
    "medical advice",
    "diagnose",
    "doctor",
    "prescribe",
    "medication",
    "symptom",
    "treatment",
    "surgery",
    "pharmacy",
    "health advice",
]


def _get_llm() -> ChatOpenAI:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is required. Set it in .env or as an environment variable."
        )
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.0,
        openai_api_key=settings.OPENAI_API_KEY,
    )


def _invoke_llm(llm: ChatOpenAI, prompt: str) -> str:
    """Invoke the LLM using the v0.2+ API (llm.invoke instead of deprecated llm.predict)."""
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content.strip()


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


def _get_session(user_profile: dict) -> dict[str, Any] | None:
    return SESSION_STORE.get(_session_key(user_profile))


def _is_medical_advice_question(question: str) -> bool:
    lower = question.lower()
    return any(keyword in lower for keyword in MEDICAL_ADVICE_KEYWORDS)


def _extract_json_from_text(text: str) -> dict | None:
    """Try to extract a JSON object from LLM output (which may include markdown code fences)."""
    # Strip markdown code fences if present
    cleaned = re.sub(r"```(?:json)?", "", text).strip().rstrip("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to find the first {...} block in case the LLM included extra text
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return None


def generate_recommendation(user_profile: dict) -> dict[str, Any]:
    """
    Run the RAG recommendation flow.

    1. Retrieve top-5 policy chunks using the user profile as context.
    2. Use ChatOpenAI to generate a STRUCTURED JSON recommendation.
    3. Parse the JSON; fall back to raw text if parsing fails.
    4. Cache the recommendation for later chat context.
    """
    user_context = _build_user_profile_context(user_profile)
    docs = retrieve_policy_chunks(
        "Make a health insurance recommendation grounded in policy documents.",
        user_profile,
    )

    if not docs:
        return {
            "peer_comparison": [],
            "coverage_details": {},
            "why_this_policy": "No policy documents are available. Please upload a policy before requesting a recommendation.",
            "source_policies": [],
        }

    source_policies = sorted({doc.metadata.get("policy_name", "unknown") for doc in docs})
    chunks_with_source = "\n\n".join(
        [
            f"[{idx + 1}] {doc.page_content}\nSource: {doc.metadata.get('policy_name')}"
            for idx, doc in enumerate(docs)
        ]
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
        '  "why_this_policy": "150-250 word explanation referencing the user name, age, lifestyle, '
        'conditions, income, and city. Be empathetic and simple. Cite the policy name."\n'
        "}\n\n"
        "Rules:\n"
        "- Include at least 2 entries in peer_comparison.\n"
        "- Reference at least 3 user fields in why_this_policy.\n"
        "- Do NOT provide medical advice.\n"
        "- Reply ONLY with the JSON object."
    )

    llm = _get_llm()
    raw_text = _invoke_llm(llm, prompt)

    # Try to parse structured JSON; fall back gracefully to raw text.
    structured = _extract_json_from_text(raw_text)
    if structured:
        _cache_session(user_profile, raw_text, source_policies)
        return {
            "peer_comparison": structured.get("peer_comparison", []),
            "coverage_details": structured.get("coverage_details", {}),
            "why_this_policy": structured.get("why_this_policy", ""),
            "source_policies": source_policies,
        }

    # Fallback: return raw text so the frontend can still display something.
    _cache_session(user_profile, raw_text, source_policies)
    return {
        "peer_comparison": [],
        "coverage_details": {},
        "why_this_policy": raw_text,
        "source_policies": source_policies,
    }


def chat_with_user(question: str, user_profile: dict) -> dict[str, Any]:
    """
    Answer user chat questions grounded in retrieved policy chunks.
    Uses the cached recommendation as additional context.
    """
    if _is_medical_advice_question(question):
        return {"answer": "I cannot provide medical advice. Please consult a doctor.", "sources": []}

    user_context = _build_user_profile_context(user_profile)
    docs = retrieve_policy_chunks(
        "Answer insurance questions using policy documents and the user profile.",
        user_profile,
    )

    if not docs:
        return {"answer": "Not found in policy documents", "sources": []}

    session = _get_session(user_profile)
    previous_recommendation = (
        session["recommendation"] if session else "No previous recommendation available."
    )

    source_policies = sorted({doc.metadata.get("policy_name", "unknown") for doc in docs})
    chunks_with_source = "\n\n".join(
        [
            f"[{idx + 1}] {doc.page_content}\nSource: {doc.metadata.get('policy_name')}"
            for idx, doc in enumerate(docs)
        ]
    )

    prompt = (
        "You are a helpful health insurance assistant. Use ONLY the retrieved policy chunks and the user profile.\n"
        "Do not ask for any more personal information. Keep the tone simple and supportive.\n"
        "If you cannot find the answer in the policy documents, reply exactly: Not found in policy documents.\n"
        "Do NOT provide medical advice.\n\n"
        f"{user_context}\n\n"
        "Previous Recommendation Context:\n"
        f"{previous_recommendation}\n\n"
        "Retrieved Policy Chunks:\n"
        f"{chunks_with_source}\n\n"
        "User Question:\n"
        f"{question}\n\n"
        "Answer clearly in simple English, using examples that relate to the user's profile. "
        "Cite the policy name when possible."
    )

    llm = _get_llm()
    answer = _invoke_llm(llm, prompt)
    return {"answer": answer, "sources": source_policies}
