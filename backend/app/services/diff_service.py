import difflib


def compare_clauses(v1_clauses, v2_clauses):

    v1_map = {
        clause.clause_number: clause
        for clause in v1_clauses
        if clause.clause_number
    }

    v2_map = {
        clause.clause_number: clause
        for clause in v2_clauses
        if clause.clause_number
    }

    all_numbers = sorted(
        set(v1_map.keys()) | set(v2_map.keys()),
        key=lambda value: [
            int(part)
            for part in value.split(".")
        ]
    )

    changes = []

    for number in all_numbers:

        old_clause = v1_map.get(number)
        new_clause = v2_map.get(number)

        if old_clause and new_clause:

            if old_clause.clause_text == new_clause.clause_text:

                changes.append({
                    "clause_number": number,
                    "clause_title": new_clause.clause_title,
                    "change_type": "UNCHANGED",
                    "before": old_clause.clause_text,
                    "after": new_clause.clause_text,
                    "risk_impact": "NO CHANGE"
                })

            else:

                diff = list(
                    difflib.ndiff(
                        old_clause.clause_text.split(),
                        new_clause.clause_text.split()
                    )
                )

                changes.append({
                    "clause_number": number,
                    "clause_title": new_clause.clause_title,
                    "change_type": "MODIFIED",
                    "before": old_clause.clause_text,
                    "after": new_clause.clause_text,
                    "diff": diff,
                    "risk_impact": "REVIEW CHANGE"
                })

        elif new_clause:

            changes.append({
                "clause_number": number,
                "clause_title": new_clause.clause_title,
                "change_type": "ADDED",
                "before": None,
                "after": new_clause.clause_text,
                "risk_impact": "REVIEW CHANGE"
            })

        elif old_clause:

            changes.append({
                "clause_number": number,
                "clause_title": old_clause.clause_title,
                "change_type": "REMOVED",
                "before": old_clause.clause_text,
                "after": None,
                "risk_impact": "HIGH - CLAUSE REMOVED"
            })

    return changes