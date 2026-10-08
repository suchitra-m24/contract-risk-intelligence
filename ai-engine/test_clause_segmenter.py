from pdf_extractor import extract_pdf_pages
from clause_segmenter import segment_contract_pages


PDF_PATH = "contracts/test_contract.pdf"


pages = extract_pdf_pages(PDF_PATH)

clauses = segment_contract_pages(pages)

print(f"Total clauses detected: {len(clauses)}")

for clause in clauses:
    print("\n" + "=" * 60)
    print(f"SECTION: {clause['section']}")
    print(f"TYPE: {clause['clause_type']}")
    print(f"PAGE: {clause['page']}")
    print("TEXT:")
    print(clause["text"])