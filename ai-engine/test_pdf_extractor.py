from pdf_extractor import extract_pdf_pages


PDF_PATH = "contracts/test_contract.pdf"


pages = extract_pdf_pages(PDF_PATH)

print(f"Total pages extracted: {len(pages)}")

for page in pages:
    print("\n" + "=" * 50)
    print(f"PAGE {page['page']}")
    print("=" * 50)
    print(page["text"])