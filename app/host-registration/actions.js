"use server";
import { getGoogleSheet } from "../../lib/googleSheet";

export async function handleRegistration(data) {
  try {
    // 1. Validate that we received the data object from the frontend
    if (!data || !data.urls) {
      throw new Error("No data or URLs received from the client.");
    }

    // 2. Destructure the data sent from the frontend
    const { 
      email, 
      phone, 
      altPhone, 
      aadharNumber, 
      urls 
    } = data;

    // 3. Connect to Google Sheets
    // This uses the GOOGLE_SERVICE_ACCOUNT_JSON we fixed earlier
    const sheet = await getGoogleSheet();

    // 4. Add the row to your spreadsheet
    // The keys here must match your Google Sheet headers exactly
    await sheet.addRow({
      "Email": email,
      "Phone": phone,
      "Alt Phone": altPhone,
      "Aadhar Number": aadharNumber,
      "Aadhar URL": urls.aadharUrl,
      "License URL": urls.licenseUrl,
      "RC URL": urls.rcUrl,
      "Insurance URL": urls.insuranceUrl,
      "Car Photos": urls.carPicUrls.filter(Boolean).join(", "), 
    });

    console.log("Successfully saved registration for:", email);
    return { success: true };

  } catch (error) {
    // This logs to your VS Code terminal
    console.error("GOOGLE_SHEETS_SAVE_ERROR:", error.message); 
    
    return { 
      success: false, 
      message: error.message || "Failed to save data to the spreadsheet." 
    };
  }
}