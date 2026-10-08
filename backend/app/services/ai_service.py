from pathlib import Path
import sys


# Main project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# AI engine directory
AI_ENGINE_DIR = PROJECT_ROOT / "ai-engine"

# Make AI engine modules importable
if str(AI_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_ENGINE_DIR))


from pipeline import ContractPipeline


_pipeline = None


def get_ai_pipeline():
    """
    Create the AI pipeline once and reuse it.
    """
    global _pipeline

    if _pipeline is None:
        _pipeline = ContractPipeline()

    return _pipeline


def analyze_contract_with_ai(file_path: str):
    """
    Run the AI engine against a PDF/DOCX contract.
    """
    pipeline = get_ai_pipeline()

    return pipeline.analyze(file_path)