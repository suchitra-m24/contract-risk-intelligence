import re


def generate_clause_v2(clause):
    """
    Generate the MVP revision of a clause.

    Only known playbook-risk patterns are changed.
    All other clause text remains unchanged.
    """

    text = clause.clause_text

    # --------------------------------------------------------
    # Payment
    # --------------------------------------------------------

    if clause.clause_title:
        title = clause.clause_title.lower()
    else:
        title = ""

    if "payment" in title:

        revised_text = re.sub(
            r"\bwithin\s+60\s+days\b",
            "within 30 days",
            text,
            flags=re.IGNORECASE
        )

        return revised_text

    # --------------------------------------------------------
    # Termination
    # --------------------------------------------------------

    if "termination" in title:

        revised_text = re.sub(
            r"\bwith\s+7\s+days\s+written\s+notice\b",
            "with 30 days written notice",
            text,
            flags=re.IGNORECASE
        )

        return revised_text

    # --------------------------------------------------------
    # No change
    # --------------------------------------------------------

    return text


def generate_contract_v2(clauses):
    """
    Generate revised clause content for Contract V2.
    """

    revised_clauses = []

    for clause in clauses:

        revised_text = generate_clause_v2(
            clause
        )

        revised_clauses.append({
            "clause_number": clause.clause_number,
            "clause_title": clause.clause_title,
            "clause_text": revised_text,
            "page_number": clause.page_number,
            "changed": (
                revised_text != clause.clause_text
            )
        })

    return revised_clauses