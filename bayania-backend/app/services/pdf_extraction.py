import logging

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TesseractCliOcrOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

logger = logging.getLogger(__name__)


def _extract_with_docling(
    file_path: str,
    force_ocr: bool,
) -> str:

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
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=options
            )
        }
    )

    result = converter.convert(file_path)

    return result.document.export_to_text()