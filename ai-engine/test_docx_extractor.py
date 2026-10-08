from docx_extractor import extract_docx_paragraphs


DOCX_PATH = "contracts/test_contract.docx"


paragraphs = extract_docx_paragraphs(DOCX_PATH)

print(f"Total paragraphs extracted: {len(paragraphs)}")

for paragraph in paragraphs:
    print("\n" + "=" * 50)
    print(f"PARAGRAPH {paragraph['paragraph']}")
    print("=" * 50)
    print(paragraph["text"])
    