import re


# Words/phrases that usually indicate an actionable obligation.
ACTION_PATTERNS = [
    r"\bdeliver\b",
    r"\bprovide\b",
    r"\bsubmit\b",
    r"\bpay\b",
    r"\bmake payment\b",
    r"\bmaintain\b",
    r"\bnotify\b",
    r"\binform\b",
    r"\bdisclose\b",
    r"\bprotect\b",
    r"\bcomply\b",
    r"\bindemnify\b",
    r"\breturn\b",
    r"\bcomplete\b",
    r"\bperform\b",
    r"\bexecute\b",
    r"\bprovide\b",
]


def extract_actor(text: str):
    """
    Extract the party responsible for an actionable obligation.
    """

    match = re.match(
        r"^\s*(The\s+(?:Buyer|Supplier|Customer|Vendor|Company|"
        r"Provider|Contractor|Client)|Each\s+party|The\s+parties)\s+"
        r"(?:shall|must|is required to)\b",
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(1).strip()

    return None


def extract_action(text: str):
    """
    Extract the action after shall/must/is required to.
    """

    match = re.search(
        r"\b(?:shall|must|is required to)\s+(.+)",
        text,
        re.IGNORECASE
    )

    if not match:
        return None

    action = match.group(1).strip()

    # Remove deadline portion.
    action = re.split(
        r"\bwithin\s+\d+\s+"
        r"(?:business\s+days?|calendar\s+days?|days?|"
        r"hours?|months?|years?)\b",
        action,
        flags=re.IGNORECASE
    )[0].strip()

    # Remove trigger portion beginning with "of", "after",
    # "upon", or "following".
    action = re.split(
        r"\b(?:of|after|upon|following)\b",
        action,
        maxsplit=1,
        flags=re.IGNORECASE
    )[0].strip()

    return action.rstrip(" .")


def extract_deadline(text: str):
    """
    Extract explicit time-based deadlines.
    """

    match = re.search(
        r"\bwithin\s+\d+\s+"
        r"(?:business\s+days?|calendar\s+days?|days?|"
        r"hours?|months?|years?)\b",
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(0).strip()

    return None


def extract_trigger(text: str):
    """
    Extract the event that triggers the obligation.
    """

    # Example:
    # "within 15 business days of receiving the purchase order"
    match = re.search(
        r"\bwithin\s+\d+\s+"
        r"(?:business\s+days?|calendar\s+days?|days?|"
        r"hours?|months?|years?)\s+"
        r"(?:of|after|upon|following)\s+(.+?)(?:\.)?$",
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(1).strip().rstrip(".")

    # Example:
    # "after receiving..."
    match = re.search(
        r"\b(?:after|upon|following)\s+(.+?)(?:\.)?$",
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(1).strip().rstrip(".")

    return None


def is_actionable_obligation(text: str):
    """
    Prevent purely legal/status clauses from being classified
    as operational obligations.

    Examples excluded:
    - liability caps
    - governing law
    - ownership statements
    """

    lower_text = text.lower()

    excluded_patterns = [
        "shall not exceed",
        "shall remain the property",
        "shall be governed",
        "shall have jurisdiction",
        "constitutes the entire agreement",
    ]

    for pattern in excluded_patterns:
        if pattern in lower_text:
            return False

    for pattern in ACTION_PATTERNS:
        if re.search(pattern, lower_text):
            return True

    return False


def extract_obligation_from_clause(clause):
    """
    Extract one actionable obligation from a contract clause.
    """

    text = clause.get("clause_text", "").strip()

    if not text:
        return None

    # Must contain obligation language.
    if not re.search(
        r"\b(?:shall|must|is required to)\b",
        text,
        re.IGNORECASE
    ):
        return None

    # Ignore non-actionable legal statements.
    if not is_actionable_obligation(text):
        return None

    actor = extract_actor(text)
    action = extract_action(text)
    deadline = extract_deadline(text)
    trigger_condition = extract_trigger(text)

    if not actor or not action:
        return None

    return {
        "clause_id": clause.get("id"),
        "clause_number": clause.get("clause_number"),
        "clause_title": clause.get("clause_title"),
        "actor": actor,
        "action": action,
        "deadline": deadline,
        "trigger_condition": trigger_condition,
        "evidence": text
    }


def extract_obligations(clauses):

    obligations = []

    for clause in clauses:

        obligation = extract_obligation_from_clause(clause)

        if obligation:
            obligations.append(obligation)

    return obligations