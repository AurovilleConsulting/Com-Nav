/**
 * Print-accurate PDF export. Triggers the browser's native print dialog so
 * the user can "Save as PDF" with full fidelity (real fonts, gradients,
 * shadows, SVG charts). The print CSS in `src/styles.css` hides everything
 * except `#pdf-export-area`, sets A4 portrait margins, and enables exact
 * color reproduction.
 *
 * The `_filename` and element args are kept for API compatibility with
 * existing call sites; the user picks the filename in the print dialog.
 */
export async function downloadElementAsPdf(
  _el?: HTMLElement | null,
  _filename?: string,
) {
  if (typeof window === "undefined") return;
  // Give React a tick to flush any pending state (e.g. disabled button) so
  // the export button isn't visually "pressed" inside the print preview.
  await new Promise((r) => setTimeout(r, 50));
  window.print();
}