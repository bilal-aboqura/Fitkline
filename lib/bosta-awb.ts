import { PDFDocument, rgb } from "pdf-lib";

export async function arrangeBostaAwbTwoPerA4(awbPdf: Uint8Array) {
  const source = await PDFDocument.load(awbPdf);
  const sourcePages = source.getPages();
  if (!sourcePages.length) throw new Error("ملف البوليصات لا يحتوي على صفحات.");

  const output = await PDFDocument.create();
  for (let index = 0; index < sourcePages.length; index += 2) {
    const firstPage = sourcePages[index];
    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();
    const outputPage = output.addPage([pageWidth, pageHeight]);

    for (let slot = 0; slot < 2; slot += 1) {
      const sourcePage = sourcePages[index + slot];
      if (!sourcePage) continue;
      const sourceWidth = sourcePage.getWidth();
      const sourceHeight = sourcePage.getHeight();
      // Bosta places the printable label in the upper half of an A4 page, but
      // its footer extends a little below the exact midpoint. Keep 54% so
      // the tracking number, creation date, and page counter are never clipped.
      const printableHeight = sourceHeight * 0.54;
      const embedded = await output.embedPage(sourcePage, {
        left: 0,
        bottom: sourceHeight - printableHeight,
        right: sourceWidth,
        top: sourceHeight,
      });
      outputPage.drawPage(embedded, {
        x: 0,
        y: slot === 0 ? pageHeight / 2 : 0,
        width: pageWidth,
        height: pageHeight / 2,
      });
    }

    outputPage.drawLine({
      start: { x: 0, y: pageHeight / 2 },
      end: { x: pageWidth, y: pageHeight / 2 },
      thickness: 0.5,
      color: rgb(0.25, 0.25, 0.25),
      dashArray: [4, 4],
    });
  }

  return output.save({ useObjectStreams: false });
}
