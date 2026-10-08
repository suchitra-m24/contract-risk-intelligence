import json
from pathlib import Path


def load_playbook(rules_path=None):
    """
    Load contract risk rules from playbook/rules.json.

    Returns:
        list[dict]: List of playbook rules.
    """

    if rules_path is None:
        project_root = Path(__file__).resolve().parent.parent
        rules_path = project_root / "playbook" / "rules.json"
    else:
        rules_path = Path(rules_path)

    if not rules_path.exists():
        raise FileNotFoundError(
            f"Playbook rules file not found: {rules_path}"
        )

    with open(rules_path, "r", encoding="utf-8") as file:
        rules = json.load(file)

    if not isinstance(rules, list):
        raise ValueError("Playbook must contain a JSON list of rules.")

    required_fields = {
        "rule_id",
        "category",
        "requirement",
        "severity",
        "description",
    }

    for rule in rules:
        missing_fields = required_fields - rule.keys()

        if missing_fields:
            raise ValueError(
                f"Rule {rule.get('rule_id', 'UNKNOWN')} "
                f"is missing fields: {sorted(missing_fields)}"
            )

    return rules


if __name__ == "__main__":
    rules = load_playbook()

    print(f"Playbook loaded successfully: {len(rules)} rules")

    for rule in rules:
        print(
            f"{rule['rule_id']} | "
            f"{rule['category']} | "
            f"{rule['severity']}"
        )