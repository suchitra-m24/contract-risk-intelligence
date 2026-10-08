from pathlib import Path

from pdf_extractor import extract_pdf_pages
from docx_extractor import extract_docx_paragraphs
from clause_segmenter import segment_contract_pages
from semantic_matcher import SemanticMatcher
from risk_analyzer import analyze_clause
from evidence_trace import (
    build_evidence_finding,
    build_evidence_report
)


class ContractPipeline:

    def __init__(self):
        print("Initializing Contract AI Pipeline...")

        self.matcher = SemanticMatcher()

        print("Pipeline initialized successfully.")

    def extract_contract(self, file_path):

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Contract not found: {file_path}"
            )

        if path.suffix.lower() == ".pdf":

            return extract_pdf_pages(str(path))

        elif path.suffix.lower() == ".docx":

            paragraphs = extract_docx_paragraphs(str(path))

            # Normalize DOCX output so that the
            # clause segmenter can use the same format
            # as PDF extraction.
            return [
                {
                    "page": item["paragraph"],
                    "text": item["text"]
                }
                for item in paragraphs
            ]

        else:
            raise ValueError(
                "Only PDF and DOCX files are supported."
            )

    def analyze(self, file_path):

        print("\n" + "=" * 70)
        print("CONTRACT AI ANALYSIS PIPELINE")
        print("=" * 70)

        # ------------------------------------------------------
        # STEP 1: EXTRACTION
        # ------------------------------------------------------

        print("\n[1/5] Extracting contract...")

        pages = self.extract_contract(file_path)

        print(
            f"Extracted {len(pages)} pages/paragraphs."
        )

        # ------------------------------------------------------
        # STEP 2: CLAUSE SEGMENTATION
        # ------------------------------------------------------

        print("\n[2/5] Segmenting clauses...")

        clauses = segment_contract_pages(pages)

        print(
            f"Detected {len(clauses)} clauses."
        )

        # ------------------------------------------------------
        # STEP 3: SEMANTIC MATCHING
        # ------------------------------------------------------

        print("\n[3/5] Matching clauses with playbook...")

        findings = []

        for clause in clauses:

            matches = self.matcher.match_clause(
                clause,
                top_k=3
            )

            # Only analyze rules that passed
            # semantic + category matching.
            matched_rules = [
                match
                for match in matches
                if match["matched"]
            ]

            for rule in matched_rules:

                print(
                    f"  Section {clause['section']} "
                    f"-> {rule['rule_id']}"
                )

                # ------------------------------------------------
                # STEP 4: RISK ANALYSIS
                # ------------------------------------------------

                risk_result = analyze_clause(
                    clause,
                    rule
                )

                # ------------------------------------------------
                # STEP 5: EVIDENCE TRACE
                # ------------------------------------------------

                finding = build_evidence_finding(
                    clause=clause,
                    rule=rule,
                    risk_result=risk_result
                )

                findings.append(finding)

        # ------------------------------------------------------
        # BUILD FINAL REPORT
        # ------------------------------------------------------

        report = build_evidence_report(
            findings
        )

        report["contract"] = str(file_path)
        report["total_clauses"] = len(clauses)

        return report


def print_report(report):

    print("\n")
    print("=" * 70)
    print("FINAL CONTRACT RISK REPORT")
    print("=" * 70)

    print(
        f"\nContract: {report['contract']}"
    )

    print(
        f"Total clauses: {report['total_clauses']}"
    )

    print(
        f"Total findings: {report['total_findings']}"
    )

    if not report["findings"]:

        print("\nNo matched findings detected.")

        return

    for number, finding in enumerate(
        report["findings"],
        start=1
    ):

        print("\n" + "-" * 70)
        print(f"FINDING {number}")
        print("-" * 70)

        print(
            f"Section: {finding['section']}"
        )

        print(
            f"Clause Type: {finding['clause_type']}"
        )

        print(
            f"Page: {finding['page']}"
        )

        print(
            f"Rule: {finding['rule_id']}"
        )

        print(
            f"Category: {finding['category']}"
        )

        print(
            f"Classification: {finding['classification']}"
        )

        print(
            f"Severity: {finding['severity']}"
        )

        print(
            f"Expected: {finding['expected_value']}"
        )

        print(
            f"Actual: {finding['actual_value']}"
        )

        print(
            f"Evidence Found: {finding['evidence_found']}"
        )

        print(
            f"Evidence: {finding['evidence_text']}"
        )

        print(
            f"Explanation: {finding['explanation']}"
        )

        print(
            f"Suggested Action: {finding['suggested_action']}"
        )


if __name__ == "__main__":

    contract_path = "contracts/test_contract.pdf"

    pipeline = ContractPipeline()

    report = pipeline.analyze(
        contract_path
    )

    print_report(report)