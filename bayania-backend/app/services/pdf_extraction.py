import logging

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TesseractCliOcrOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

logger = logging.getLogger(__name__)


def extract_text_docling(file_path: str, force_ocr: bool = False) -> str:
    """
    Extrait le texte d'un PDF.
    - force_ocr=False (défaut) : utilise la couche texte native si disponible,
      adapté aux documents utilisateurs normaux (contrats, jugements propres).
    - force_ocr=True : force l'OCR complet, à réserver aux documents dont
      l'encodage de police est connu pour être cassé (corpus juridique historique).
    """
    ocr_options = TesseractCliOcrOptions(
        lang=["ara", "fra"],
        force_full_page_ocr=force_ocr,
    )

    options = PdfPipelineOptions(
        do_ocr=True,
        ocr_options=ocr_options,
        do_table_structure=False,
        do_picture_classification=False,
    )
    converter = DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=options)}
    )

    try:
        result = converter.convert(file_path)
    except Exception as exc:
        logger.error(f"Docling extraction failed: {exc}")
        raise

    return result.document.export_to_text()