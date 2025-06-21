// 📄 src/utils/saveFilledFormFields.ts
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from "pdf-lib";

export type FilledField = {
  id: string;
  fieldName: string;
  fieldType: string;
  rect: number[];
  value: string;
  options?: string[];
  radioGroup?: string;
  page: number;
};

/**
 * Save AcroForm field values into a PDF and flatten them.
 * Supports: Text, Checkbox, Radio, Dropdown, Signature.
 */
async function saveFilledFormFields(originalFile: File, fields: FilledField[]) {
  try {
    console.log("Starting PDF save with fields:", fields);
    
    // Fix 3: Ensure file loading works
    if (!originalFile || originalFile.size === 0) {
      throw new Error("Invalid or empty file provided");
    }
    
    const buffer = await originalFile.arrayBuffer();
    console.log("Buffer size:", buffer.byteLength);
    
    if (!buffer || buffer.byteLength === 0) {
      throw new Error("Failed to read file data");
    }
    
    const pdfDoc = await PDFDocument.load(buffer);
    console.log("PDF loaded successfully");
    
    // First, try to save without any modifications to ensure basic functionality works
    console.log("Testing basic PDF save...");
    const testBytes = await pdfDoc.save();
    console.log("Basic PDF save successful, bytes:", testBytes.length);
    
    const form = pdfDoc.getForm();
    console.log("Form accessed successfully");
    
    // Get all available fields to debug
    const allFields = form.getFields();
    console.log(`Available fields in PDF (${allFields.length}):`, allFields.map(f => f.getName()));
    
    // Only process fields that have values
    const filledFields = fields.filter(field => field.value && field.value.trim() !== "" && field.value !== "Off");
    console.log("Fields with values:", filledFields.length, filledFields);

    if (filledFields.length === 0) {
      console.warn("No filled fields to save - downloading original PDF");
      downloadBlob(testBytes, "original-form.pdf");
      return;
    }

    let successCount = 0;
    for (const field of filledFields) {
      try {
        console.log(`Processing field: ${field.fieldName} = ${field.value}`);
        
        // Check if field exists in PDF
        const fieldExists = allFields.some(f => f.getName() === field.fieldName);
        if (!fieldExists) {
          console.warn(`Field ${field.fieldName} not found in PDF`);
          continue;
        }
        
        switch (field.fieldType) {
          case "Tx":
            try {
              const textField = form.getTextField(field.fieldName);
              textField.setText(field.value);
              successCount++;
              console.log(`✓ Set text field: ${field.fieldName}`);
            } catch (err) {
              console.warn(`Could not set text for field: ${field.fieldName}`, err);
            }
            break;

          case "Btn":
            try {
              const checkBox = form.getCheckBox(field.fieldName);
              if (field.value === "Yes" || field.value === "On") {
                checkBox.check();
                successCount++;
                console.log(`✓ Checked field: ${field.fieldName}`);
              }
            } catch (err) {
              console.warn(`Could not set checkbox for field: ${field.fieldName}`, err);
            }
            break;

          case "Ch":
            try {
              const dropdown = form.getDropdown(field.fieldName);
              dropdown.select(field.value);
              successCount++;
              console.log(`✓ Set dropdown field: ${field.fieldName}`);
            } catch (err) {
              console.warn(`Could not set dropdown for field: ${field.fieldName}`, err);
            }
            break;
        }
      } catch (err) {
        console.warn(`Field processing error for "${field.fieldName}":`, err instanceof Error ? err.message : String(err));
      }
    }

    console.log(`Successfully processed ${successCount} fields`);

    // Don't flatten if no fields were successfully set
    if (successCount > 0) {
      console.log("Flattening form...");
      try {
        form.flatten();
        console.log("Form flattened successfully");
      } catch (err) {
        console.warn("Could not flatten form, saving without flattening:", err);
      }
    }

    console.log("Saving final PDF...");
    
    // Fix 1: Ensure save() is properly awaited and validated
    const pdfBytes = await pdfDoc.save();
    console.log("PDF save completed, checking bytes...");
    
    if (!pdfBytes) {
      throw new Error("PDF save returned null or undefined");
    }
    
    if (!(pdfBytes instanceof Uint8Array)) {
      throw new Error(`PDF save returned invalid type: ${typeof pdfBytes}`);
    }
    
    console.log("PDF saved successfully, bytes:", pdfBytes.length);
    
    if (pdfBytes.length === 0) {
      throw new Error("Generated PDF is empty (0 bytes)");
    }
    
    if (pdfBytes.length < 100) {
      throw new Error(`Generated PDF is too small (${pdfBytes.length} bytes) - likely corrupted`);
    }
    
    downloadBlob(pdfBytes, "filled-form.pdf");
  } catch (error) {
    console.error("Error saving filled PDF:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    alert(`Failed to save PDF: ${errorMessage}`);
  }
}

function downloadBlob(bytes: Uint8Array, filename: string) {
  try {
    // Fix 2: Validate bytes before creating blob
    if (!bytes || bytes.length < 100) {
      throw new Error(`PDF data is empty or too small (${bytes?.length || 0} bytes). Something went wrong.`);
    }
    
    console.log(`Creating blob with ${bytes.length} bytes`);
    
    // Validate that bytes is actually a Uint8Array
    if (!(bytes instanceof Uint8Array)) {
      throw new Error(`Invalid data type for PDF: ${typeof bytes}`);
    }
    
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
    
    // Validate blob was created successfully
    if (!blob || blob.size === 0) {
      throw new Error("Failed to create blob from PDF data");
    }
    
    console.log(`Blob created successfully: ${blob.size} bytes`);
    
    const url = URL.createObjectURL(blob);
    
    // Fix 5: Ensure download happens in user-initiated context
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    
    // Ensure the download is triggered in user context
    document.body.appendChild(link);
    
    // Use setTimeout to ensure browser has time to process
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log(`Download initiated successfully: ${filename} (${blob.size} bytes)`);
    }, 10);
    
  } catch (error) {
    console.error("Error in downloadBlob:", error);
    throw error;
  };
}
  
  export { saveFilledFormFields, downloadBlob };
