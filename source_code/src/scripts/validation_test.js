const fs = require('fs');
const pdfParse = require('pdf-parse');

const PDF_PATH = './test_invoice.pdf'; // Your uploaded file

const isFormattedDate = (text) =>
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/.test(text);

const isValidEmail = (text) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text);

fs.readFile(PDF_PATH, async (err, buffer) => {
  if (err) {
    console.error('❌ Could not read PDF file:', err);
    return;
  }

  const data = await pdfParse(buffer);
  const text = data.text;
  const errors = [];

  // Optional: print the full extracted text

  if (!text.includes('INVOICE')) errors.push('Missing "INVOICE" title');
  if (!text.includes('ServiceSuite')) errors.push('Missing company name "ServiceSuite"');

  if (!/Invoice #:\s*INV-\w+/.test(text)) errors.push('Missing or invalid invoice number');
  if (!text.includes('Date:') || !isFormattedDate(text)) errors.push('Missing or invalid invoice date');
  if (!text.includes('Due:') || !isFormattedDate(text)) errors.push('Missing or invalid due date');

  if (!text.includes('From:')) errors.push('Missing provider "From:" section');
  if (!text.includes('Bill To:')) errors.push('Missing client "Bill To:" section');

  if (!isValidEmail(text)) errors.push('No valid email address found');

  if (!text.includes('Description') || !text.includes('Qty') || !text.includes('Rate') || !text.includes('Amount')) {
    errors.push('Missing item table headers');
  }

  if (!text.includes('Subtotal:') || !/\$\d+\.\d{2}/.test(text)) {
    errors.push('Missing or invalid subtotal');
  }

  if (!/Total:\s*\$?\d+\.\d{2}/.test(text)) {
    errors.push('Missing or invalid total');
  }

  // // Final report
  // if (errors.length > 0) {
  //   errors.forEach(e => console.log('- ' + e));
  // } else {
  // }
});
