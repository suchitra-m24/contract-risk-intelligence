import json
import re
from pathlib import Path


PLAYBOOK_PATH = (
    Path(__file__).resolve().parents[3]
    / "playbook"
    / "rules.json"
)


def load_playbook():
    with open(PLAYBOOK_PATH, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data["rules"]


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def analyze_clause(clause_text: str, rule: dict):
    """
    Compare one contract clause against one playbook rule.
    """

    text = normalize_text(clause_text)

    category = rule["category"]

    # ==================================================
    # TERMINATION
    # ==================================================

    if category == "Termination":

        if "terminat" not in text:
            return None

        days_match = re.search(
            r"(\d+)\s*(?:calendar\s*)?days?",
            text
        )

        if days_match:
            actual_days = int(days_match.group(1))

            if actual_days < 30:
                return {
                    "status": "RISKY",
                    "severity": rule["severity"],
                    "evidence": clause_text,
                    "expected": "At least 30 days",
                    "actual": f"{actual_days} days",
                    "reason": (
                        f"The contract provides {actual_days} days "
                        "of termination notice, which is below "
                        "the required 30 days."
                    ),
                    "recommended_action": (
                        "Amend the termination notice period "
                        "to at least 30 days."
                    )
                }

            return {
                "status": "STANDARD",
                "severity": "LOW",
                "evidence": clause_text,
                "expected": "At least 30 days",
                "actual": f"{actual_days} days",
                "reason": (
                    f"The contract provides {actual_days} days "
                    "of termination notice."
                ),
                "recommended_action": "No action required."
            }

        return {
            "status": "AMBIGUOUS",
            "severity": "MEDIUM",
            "evidence": clause_text,
            "expected": "At least 30 days",
            "actual": "Notice period not clearly specified",
            "reason": (
                "Termination is mentioned but the notice period "
                "is unclear."
            ),
            "recommended_action": (
                "Review the termination clause and specify "
                "a clear notice period."
            )
        }

    # ==================================================
    # PAYMENT
    # ==================================================

    if category == "Payment":

        if not any(word in text for word in [
            "payment",
            "pay",
            "invoice",
            "paid"
        ]):
            return None

        days_match = re.search(
            r"(\d+)\s*(?:calendar\s*)?days?",
            text
        )

        if days_match:
            actual_days = int(days_match.group(1))

            if actual_days > 30:
                return {
                    "status": "RISKY",
                    "severity": rule["severity"],
                    "evidence": clause_text,
                    "expected": "Payment within 30 days",
                    "actual": f"{actual_days} days",
                    "reason": (
                        f"The contract allows payment after "
                        f"{actual_days} days, exceeding the "
                        "30-day playbook requirement."
                    ),
                    "recommended_action": (
                        "Amend payment terms to require payment "
                        "within 30 days."
                    )
                }

            return {
                "status": "STANDARD",
                "severity": "LOW",
                "evidence": clause_text,
                "expected": "Payment within 30 days",
                "actual": f"{actual_days} days",
                "reason": (
                    "Payment terms comply with the playbook."
                ),
                "recommended_action": "No action required."
            }

        return {
            "status": "AMBIGUOUS",
            "severity": "MEDIUM",
            "evidence": clause_text,
            "expected": "Payment within 30 days",
            "actual": "Payment period unclear",
            "reason": (
                "Payment is mentioned but the payment period "
                "is unclear."
            ),
            "recommended_action": (
                "Review and specify a clear payment period."
            )
        }

    # ==================================================
    # REQUIRED CLAUSES
    # ==================================================

    keyword_map = {
        "Confidentiality": [
            "confidential",
            "confidentiality",
            "non-disclosure"
        ],
        "Indemnification": [
            "indemnif",
            "indemnity"
        ],
        "Liability": [
            "liability",
            "liable",
            "limitation of liability"
        ],
        "IP Ownership": [
            "intellectual property",
            "ip ownership",
            "ownership of intellectual property",
            "proprietary rights"
        ],
        "Data Protection": [
            "data protection",
            "personal data",
            "privacy",
            "data privacy"
        ],
        "Governing Law": [
            "governing law",
            "laws of",
            "jurisdiction"
        ]
    }

    keywords = keyword_map.get(category, [])

    if keywords and any(keyword in text for keyword in keywords):

        return {
            "status": "STANDARD",
            "severity": "LOW",
            "evidence": clause_text,
            "expected": rule["requirement"],
            "actual": "Clause present",
            "reason": (
                f"The contract contains a {category} provision."
            ),
            "recommended_action": "No action required."
        }

    return None


def analyze_clauses(clauses):
    """
    Analyze extracted clauses against all playbook rules.
    Also detects playbook rules for which no relevant
    contract clause exists.
    """

    rules = load_playbook()

    findings = []

    # Track which rules/categories were found
    matched_categories = set()

    # --------------------------------------------------
    # Analyze existing clauses
    # --------------------------------------------------

    for clause in clauses:

        for rule in rules:

            result = analyze_clause(
                clause["clause_text"],
                rule
            )

            if result:

                matched_categories.add(rule["category"])

                finding = {
                    "rule_id": rule["rule_id"],
                    "category": rule["category"],
                    "clause_id": clause.get("id"),
                    "clause_number": clause.get("clause_number"),
                    "page_number": clause.get("page_number"),
                    **result
                }

                findings.append(finding)

    # --------------------------------------------------
    # Detect missing required clauses
    # --------------------------------------------------

    for rule in rules:

        category = rule["category"]

        if category not in matched_categories:

            findings.append({
                "rule_id": rule["rule_id"],
                "category": category,
                "clause_id": None,
                "clause_number": None,
                "page_number": None,
                "status": "MISSING",
                "severity": rule["severity"],
                "evidence": None,
                "expected": rule["requirement"],
                "actual": "No relevant clause found",
                "reason": (
                    f"No {category} clause was found "
                    "in the contract."
                ),
                "recommended_action": (
                    f"Add a {category} clause that satisfies "
                    "the playbook requirement."
                )
            })

    return findings