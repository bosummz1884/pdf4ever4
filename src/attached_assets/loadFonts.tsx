import { PDFDocument } from "pdf-lib";

// Comprehensive font paths for widely-used fonts
const fontPaths: Record<string, string> = {
  "Arial": "/fonts/arial.ttf",
  "Helvetica": "/fonts/helvetica.ttf",
  "Times New Roman": "/fonts/times-new-roman.ttf",
  "Courier New": "/fonts/courier-new.ttf",
  "Verdana": "/fonts/verdana.ttf",
  "Georgia": "/fonts/georgia.ttf",
  "Trebuchet MS": "/fonts/trebuchet-ms.ttf",
  "Tahoma": "/fonts/tahoma.ttf",
  "Impact": "/fonts/impact.ttf",
  "Comic Sans MS": "/fonts/comic-sans-ms.ttf",
  "Roboto": "/fonts/roboto.ttf",
  "Open Sans": "/fonts/open-sans.ttf",
  "Lato": "/fonts/lato.ttf",
  "Montserrat": "/fonts/montserrat.ttf",
  "Oswald": "/fonts/oswald.ttf",
  "Raleway": "/fonts/raleway.ttf",
  "PT Sans": "/fonts/pt-sans.ttf",
  "Source Sans Pro": "/fonts/source-sans-pro.ttf",
  "Merriweather": "/fonts/merriweather.ttf",
  "Noto Sans": "/fonts/noto-sans.ttf",
  "Ubuntu": "/fonts/ubuntu.ttf",
  "Nunito": "/fonts/nunito.ttf",
  "Work Sans": "/fonts/work-sans.ttf",
  "Rubik": "/fonts/rubik.ttf",
  "Poppins": "/fonts/poppins.ttf",
  "Inter": "/fonts/inter.ttf",
  "Fira Sans": "/fonts/fira-sans.ttf",
  "Cabin": "/fonts/cabin.ttf",
  "Playfair Display": "/fonts/playfair-display.ttf",
  "Titillium Web": "/fonts/titillium-web.ttf",
  "Inconsolata": "/fonts/inconsolata.ttf",
  "IBM Plex Sans": "/fonts/ibm-plex-sans.ttf",
  "Quicksand": "/fonts/quicksand.ttf",
  "Assistant": "/fonts/assistant.ttf",
  "Mukta": "/fonts/mukta.ttf",
  "Arimo": "/fonts/arimo.ttf",
  "Karla": "/fonts/karla.ttf",
  "Josefin Sans": "/fonts/josefin-sans.ttf",
  "Manrope": "/fonts/manrope.ttf",
  "Zilla Slab": "/fonts/zilla-slab.ttf",
  "Space Grotesk": "/fonts/space-grotesk.ttf",
  "Barlow": "/fonts/barlow.ttf",
  "Cairo": "/fonts/cairo.ttf",
  "DM Sans": "/fonts/dm-sans.ttf",
  "Mulish": "/fonts/mulish.ttf",
  "Heebo": "/fonts/heebo.ttf",
  "Exo 2": "/fonts/exo-2.ttf",
  "Be Vietnam Pro": "/fonts/be-vietnam-pro.ttf",
  "Anton": "/fonts/anton.ttf"
};

/**
 * Preloads font files and embeds them into the given PDF document.
 * Returns a map of fontName → embeddedFont.
 */
async function loadFonts(pdfDoc: PDFDocument): Promise<Record<string, any>> {
  const fontMap: Record<string, any> = {};

  for (const [fontName, path] of Object.entries(fontPaths)) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const fontBytes = await response.arrayBuffer();
        const embeddedFont = await pdfDoc.embedFont(fontBytes);
        fontMap[fontName] = embeddedFont;
        console.log(`Successfully loaded font: ${fontName}`);
      } else {
        console.warn(`Font file not found: ${fontName} at ${path}`);
      }
    } catch (err) {
      console.warn(`Font load failed: ${fontName} from ${path}`, err);
    }
  }

  return fontMap;
}

/**
 * Get available font names that can be loaded
 */
function getAvailableFontNames(): string[] {
  return Object.keys(fontPaths);
}

/**
 * Check if a font is available for loading
 */
function isFontAvailable(fontName: string): boolean {
  return fontName in fontPaths;
}

/**
 * Get the path for a specific font
 */
function getFontPath(fontName: string): string | undefined {
  return fontPaths[fontName];
}

export { loadFonts, getAvailableFontNames, isFontAvailable, getFontPath };

  
  
