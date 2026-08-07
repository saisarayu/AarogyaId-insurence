"""
Recommendation Engine for Health Insurance Policies.

Matches policies based on selected disease categories across any age group,
returning every outcome (single-disease matches, multi-disease matches, and combined policies).
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from app.services.policy_service import list_policies_raw


def get_current_day_name() -> str:
    """Return current day of week (e.g., 'Monday', 'Tuesday', ...)."""
    return datetime.now().strftime("%A")


def evaluate_recommendations(
    diseases: List[str],
    annual_income: float = 10000000.0,
    age: int = 35,
    day_of_week: Optional[str] = None,
    scheme_type: Optional[str] = "All",
    min_coverage: Optional[float] = 0.0,
) -> Dict[str, Any]:
    """
    Evaluates policy recommendations for selected diseases across any age group.
    Returns every matching outcome (Cancer, Diabetes, Cancer+Diabetes, etc.).
    """
    target_day = day_of_week if day_of_week else get_current_day_name()
    all_policies = list_policies_raw()

    eligible_policies = []
    rejected_reasons = []

    # Clean user selected disease list
    search_diseases = [d.strip() for d in diseases if d and d.strip()]
    search_diseases_lower = [d.lower() for d in search_diseases]

    for policy in all_policies:
        pname = policy.get("policy_name", "Unknown Policy")

        # Step 1: Status check (Active only)
        status = policy.get("status", "Active")
        if status.lower() != "active":
            rejected_reasons.append({"policy": pname, "reason": "Policy is currently inactive."})
            continue

        # Step 2: Day of Week Schedule Check
        activation_days = policy.get("activation_days") or [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ]
        active_days_lower = [d.lower() for d in activation_days]
        if target_day.lower() not in active_days_lower:
            rejected_reasons.append({
                "policy": pname,
                "reason": f"Policy not active on {target_day}. Active days: {', '.join(activation_days)}"
            })
            continue

        # Step 3: Disease Category Matching (Match ANY selected disease)
        pol_categories = policy.get("disease_categories") or []
        
        matched_user_diseases = []
        if search_diseases_lower:
            for sd, sd_raw in zip(search_diseases_lower, search_diseases):
                for pc in pol_categories:
                    pc_lower = pc.lower()
                    if sd in pc_lower or pc_lower in sd:
                        if sd_raw not in matched_user_diseases:
                            matched_user_diseases.append(sd_raw)
                        break

            # If user selected diseases but policy has no match with any of them, skip
            if not matched_user_diseases:
                rejected_reasons.append({
                    "policy": pname,
                    "reason": f"Does not cover any of the selected diseases: {', '.join(search_diseases)}"
                })
                continue
        else:
            # If no disease specified, include all policy categories
            matched_user_diseases = pol_categories

        # Step 4: Strict Children's Age Check (Must be strictly BELOW 15, i.e., age < 15)
        is_child_policy = any(
            kw in " ".join([c.lower() for c in pol_categories])
            for kw in ["child", "pediatric", "children", "baby", "infant"]
        ) or any(
            kw in " ".join(search_diseases_lower)
            for kw in ["child", "pediatric", "children", "baby", "infant"]
        )

        if is_child_policy and age >= 15:
            rejected_reasons.append({
                "policy": pname,
                "reason": f"Applicant age ({age} yrs) is 15 or above. Children schemes strictly require age BELOW 15 years."
            })
            continue

        # Step 5: Income Check (Only filter if income limit is set and user income strictly exceeds it)
        income_limit = float(policy.get("annual_income_limit") or 10000000.0)
        if annual_income > income_limit:
            rejected_reasons.append({
                "policy": pname,
                "reason": f"User annual income (₹{annual_income:,.0f}) exceeds policy limit (₹{income_limit:,.0f})."
            })
            continue

        # Step 6: Scheme type & Coverage filters
        pol_scheme = policy.get("scheme_type", "Government")
        if scheme_type and scheme_type.lower() != "all" and pol_scheme.lower() != scheme_type.lower():
            rejected_reasons.append({
                "policy": pname,
                "reason": f"Policy scheme ({pol_scheme}) does not match requested ({scheme_type})."
            })
            continue

        coverage = float(policy.get("coverage_amount", 500000.0))
        if min_coverage and coverage < min_coverage:
            rejected_reasons.append({
                "policy": pname,
                "reason": f"Policy coverage (₹{coverage:,.0f}) below requested minimum (₹{min_coverage:,.0f})."
            })
            continue

        # Determine match outcome type (e.g. Single Disease vs Multi-Disease Combo)
        match_count = len(matched_user_diseases)
        if match_count > 1:
            match_type = f"Multi-Disease Combo ({', '.join(matched_user_diseases)})"
        elif match_count == 1:
            match_type = f"Specific Match ({matched_user_diseases[0]})"
        else:
            match_type = "General Health Scheme"

        is_below_15 = (age < 15)
        child_status = "Child (Age < 15) OK" if is_below_15 else None

        disease_score = min(100.0, match_count * 40.0) if search_diseases else 70.0
        coverage_score = min(100.0, (coverage / 1000000.0) * 50.0)
        relevance_score = round(min(100.0, disease_score * 0.6 + coverage_score * 0.4), 1)

        enriched_policy = {
            **policy,
            "matched_user_diseases": matched_user_diseases,
            "match_count": match_count,
            "match_type": match_type,
            "relevance_score": relevance_score,
            "eligibility_status": "Child Approved (Age < 15)" if is_below_15 else "Eligible for Adult / General",
            "is_child_age": is_below_15,
            "child_status": child_status,
            "active_today": True,
            "today": target_day,
            "download_url": f"/policies/download/{policy.get('file_name', '')}"
        }
        eligible_policies.append(enriched_policy)

    # Step 6: Remove duplicates by policy id / file_name
    seen_ids = set()
    unique_eligible = []
    for pol in eligible_policies:
        identifier = pol.get("id") or pol.get("file_name")
        if identifier not in seen_ids:
            seen_ids.add(identifier)
            unique_eligible.append(pol)

    # Step 7: Sort by Relevance (Highest match count & relevance first)
    sorted_eligible = sorted(
        unique_eligible,
        key=lambda p: (p.get("match_count", 0), p.get("relevance_score", 0), p.get("coverage_amount", 0)),
        reverse=True,
    )

    # Step 8: Build disease-specific categorization & combo breakdowns
    by_disease: Dict[str, List[Dict[str, Any]]] = {}
    for d in search_diseases:
        by_disease[d] = []
        d_lower = d.lower()
        for pol in sorted_eligible:
            matched_lower = [m.lower() for m in pol.get("matched_user_diseases", [])]
            pol_cats_lower = [c.lower() for c in (pol.get("disease_categories") or [])]
            if d_lower in matched_lower or any(d_lower in c for c in pol_cats_lower):
                by_disease[d].append(pol)

    combo_policies = [p for p in sorted_eligible if p.get("match_count", 0) >= 2]

    # Build full system policies list with eligibility status for "All Policies" view
    all_system_policies = []
    eligible_ids = {p.get("id") or p.get("file_name") for p in sorted_eligible}
    rejected_dict = {r["policy"]: r["reason"] for r in rejected_reasons}

    for p in all_policies:
        pid = p.get("id") or p.get("file_name")
        pname = p.get("policy_name", "Unknown Policy")
        is_elig = pid in eligible_ids
        rej_reason = rejected_dict.get(pname, "")
        all_system_policies.append({
            **p,
            "is_eligible": is_elig,
            "rejection_reason": rej_reason if not is_elig else "",
            "download_url": f"/policies/download/{p.get('file_name', '')}"
        })

    return {
        "count": len(sorted_eligible),
        "target_day": target_day,
        "selected_diseases": search_diseases,
        "recommended_policies": sorted_eligible,
        "combo_policies": combo_policies,
        "by_disease": by_disease,
        "all_system_policies": all_system_policies,
        "rejected_policies": rejected_reasons,
    }


def score_policy(policy: Dict[str, Any], income_key: str) -> float:
    return float(policy.get("relevance_score", 85.0))


def rank_policies(peer_comparison: List[Dict[str, Any]], income_key: str) -> List[Dict[str, Any]]:
    return peer_comparison
