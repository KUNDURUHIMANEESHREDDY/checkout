import { Product, ReceiptData, ReceiptItem } from '../types';
import { PDFDocument, rgb } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

class ReceiptService {
  static async generateReceiptPdf(
    items: Product[],
    customerName: string = 'Customer',
    customerPhone: string = ''
  ): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([300, 600]);
    
    const now = new Date();
    const invoiceId = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const taxRate = 0.18;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // Draw content
    let y = 550;
    
    // Header
    page.drawText('G FRESH SUPERMARKET', {
      x: 50,
      y,
      size: 18,
      color: rgb(0.06, 0.74, 0.51), // Green color
    });
    y -= 20;
    
    page.drawText('AI-Powered Smart Checkout (Local)', {
      x: 50,
      y,
      size: 12,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 30;
    
    // Invoice info
    page.drawText(`Invoice: ${invoiceId}`, { x: 50, y, size: 10 });
    y -= 15;
    page.drawText(`Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, { x: 50, y, size: 10 });
    y -= 15;
    page.drawText(`Customer: ${customerName}`, { x: 50, y, size: 10 });
    if (customerPhone) {
      y -= 15;
      page.drawText(`Phone: ${customerPhone}`, { x: 50, y, size: 10 });
    }
    y -= 25;
    
    // Table headers
    page.drawText('Item', { x: 50, y, size: 12, color: rgb(1, 1, 1) });
    page.drawText('Price', { x: 180, y, size: 12, color: rgb(1, 1, 1) });
    y -= 20;
    
    // Draw header background
    page.drawRectangle({
      x: 45,
      y: y + 5,
      width: 210,
      height: 20,
      color: rgb(0.06, 0.74, 0.51),
    });
    
    // Items
    for (const item of items) {
      y -= 15;
      const itemTotal = item.price;
      
      page.drawText(`${item.brand} - ${item.short_name}`, { x: 50, y, size: 10 });
      page.drawText(`($${item.price.toFixed(2)})`, { x: 180, y, size: 10 });
      y -= 12;
      page.drawText(`${item.variant}`, { x: 55, y, size: 8, color: rgb(0.5, 0.5, 0.5) });
    }
    
    y -= 20;
    
    // Totals
    page.drawText(`Subtotal: $${subtotal.toFixed(2)}`, { x: 50, y, size: 10 });
    y -= 15;
    page.drawText(`Tax (${(taxRate * 100).toFixed(0)}%): $${tax.toFixed(2)}`, { x: 50, y, size: 10 });
    y -= 15;
    page.drawText(`TOTAL: $${total.toFixed(2)}`, { 
      x: 50, 
      y, 
      size: 12, 
      color: rgb(0.06, 0.74, 0.51)
    });
    y -= 25;
    
    // Footer
    page.drawText('Thank you for shopping with G Fresh!', {
      x: 50,
      y,
      size: 10,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 12;
    page.drawText('Eco-friendly Digital Receipt', {
      x: 50,
      y,
      size: 8,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const fileUri = FileSystem.documentDirectory + `receipt_${invoiceId}.pdf`;
    
    await FileSystem.writeAsStringAsync(fileUri, '', { encoding: FileSystem.EncodingType.Base64 });
    await FileSystem.writeAsStringAsync(fileUri, Buffer.from(pdfBytes).toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return fileUri;
  }

  static async shareReceipt(pdfUri: string): Promise<void> {
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Receipt',
      UTI: 'com.adobe.pdf',
    });
  }

  static generateReceiptText(
    items: Product[],
    customerName: string = 'Customer',
    customerPhone: string = ''
  ): string {
    const now = new Date();
    const invoiceId = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const taxRate = 0.18;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    let receipt = '='.repeat(50) + '\n';
    receipt += 'G FRESH SUPERMARKET\n';
    receipt += 'AI-Powered Smart Checkout (Local)\n';
    receipt += '='.repeat(50) + '\n\n';
    receipt += `Invoice: ${invoiceId}\n`;
    receipt += `Date: ${now.toLocaleString()}\n`;
    receipt += `Customer: ${customerName}\n`;
    if (customerPhone) {
      receipt += `Phone: ${customerPhone}\n`;
    }
    receipt += '\n' + '-'.repeat(50) + '\n';
    receipt += 'ITEMS:\n';
    receipt += '-'.repeat(50) + '\n';
    
    for (const item of items) {
      receipt += `${item.brand} - ${item.short_name}\n`;
      receipt += `  Variant: ${item.variant}\n`;
      receipt += `  Price: $${item.price.toFixed(2)}\n`;
      receipt += '\n';
    }
    
    receipt += '-'.repeat(50) + '\n';
    receipt += `Subtotal: $${subtotal.toFixed(2)}\n`;
    receipt += `Tax (${(taxRate * 100).toFixed(0)}%): $${tax.toFixed(2)}\n`;
    receipt += `TOTAL: $${total.toFixed(2)}\n`;
    receipt += '='.repeat(50) + '\n';
    receipt += '\nThank you for shopping at G Fresh!\n';
    receipt += 'Eco-friendly Digital Receipt\n';
    
    return receipt;
  }
}

export default ReceiptService;
