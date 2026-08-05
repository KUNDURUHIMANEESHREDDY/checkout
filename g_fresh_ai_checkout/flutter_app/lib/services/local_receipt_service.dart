import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import '../models/product.dart';

class LocalReceiptService {
  static Future<File> generateReceiptPdf({
    required List<Product> items,
    required String customerName,
    required String customerPhone,
    double taxRate = 0.18,
  }) async {
    // Calculate totals
    final subtotal = items.fold(0.0, (sum, item) => sum + item.price);
    final tax = subtotal * taxRate;
    final total = subtotal + tax;
    
    // Generate invoice ID
    final now = DateTime.now();
    final invoiceId = "INV-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}${now.second.toString().padLeft(2, '0')}";
    
    final pdf = pw.Document();
    
    pdf.addPage(
      pw.MultiPage(
        build: (pw.Context context) => [
          // Header
          pw.Center(
            child: pw.Column(
              children: [
                pw.Text(
                  'G FRESH SUPERMARKET',
                  style: pw.TextStyle(
                    fontSize: 24,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.green600,
                  ),
                ),
                pw.SizedBox(height: 8),
                pw.Text(
                  'AI-Powered Smart Checkout (Local)',
                  style: pw.TextStyle(
                    fontSize: 14,
                    color: PdfColors.grey600,
                  ),
                ),
                pw.SizedBox(height: 16),
                pw.Divider(color: PdfColors.grey300, thickness: 2),
                pw.SizedBox(height: 16),
              ],
            ),
          ),
          
          // Invoice Info
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('Invoice: $invoiceId'),
                  pw.SizedBox(height: 4),
                  pw.Text('Date: ${_formatDate(now)}'),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text('Customer: $customerName'),
                  pw.SizedBox(height: 4),
                  pw.Text('Phone: $customerPhone'),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: 20),
          
          // Items Table
          pw.Table.fromTextArray(
            headers: ['#', 'Item', 'Price', 'Qty', 'Total'],
            data: List.generate(
              items.length,
              (index) => [
                (index + 1).toString(),
                '${items[index].brand} - ${items[index].shortName}\n(${items[index].variant})',
                '\$${items[index].price.toStringAsFixed(2)}',
                '1',
                '\$${items[index].price.toStringAsFixed(2)}',
              ],
            ),
            border: pw.TableBorder.all(color: PdfColors.grey300),
            headerStyle: pw.TextStyle(
              fontWeight: pw.FontWeight.bold,
              color: PdfColors.white,
            ),
            headerDecoration: pw.BoxDecoration(
              color: PdfColors.green600,
            ),
            cellAlignment: pw.Alignment.centerLeft,
            cellPadding: const pw.EdgeInsets.all(8),
            columnWidths: {
              0: const pw.FixedColumnWidth(30),
              1: const pw.FlexColumnWidth(2),
              2: const pw.FixedColumnWidth(80),
              3: const pw.FixedColumnWidth(50),
              4: const pw.FixedColumnWidth(80),
            },
          ),
          pw.SizedBox(height: 16),
          
          // Totals
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.end,
            children: [
              pw.SizedBox(
                width: 200,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.end,
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('Subtotal:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                        pw.Text('\$${subtotal.toStringAsFixed(2)}'),
                      ],
                    ),
                    pw.SizedBox(height: 4),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('Tax (${(taxRate * 100).toStringAsFixed(0)}%):', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                        pw.Text('\$${tax.toStringAsFixed(2)}'),
                      ],
                    ),
                    pw.Divider(color: PdfColors.grey300, thickness: 1),
                    pw.SizedBox(height: 4),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('TOTAL:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 16)),
                        pw.Text('\$${total.toStringAsFixed(2)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 24),
          
          // Footer
          pw.Center(
            child: pw.Column(
              children: [
                pw.Divider(color: PdfColors.grey300, thickness: 2),
                pw.SizedBox(height: 8),
                pw.Text(
                  'Thank you for shopping with G Fresh!',
                  style: pw.TextStyle(
                    fontSize: 14,
                    fontStyle: pw.FontStyle.italic,
                  ),
                ),
                pw.SizedBox(height: 4),
                pw.Text(
                  'Eco-friendly Digital Receipt',
                  style: pw.TextStyle(
                    fontSize: 10,
                    color: PdfColors.grey500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
    
    // Save PDF to local storage
    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/receipt_$invoiceId.pdf');
    await file.writeAsBytes(await pdf.save());
    
    return file;
  }
  
  static String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}:${date.second.toString().padLeft(2, '0')}';
  }
}
