import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';
import '../providers/cart_provider.dart';

class ReceiptService {
  static Future<void> generateAndPrintReceipt(List<CartItem> items, double total) async {
    final pdf = pw.Document();
    final now = DateTime.now();
    final dateStr = DateFormat('dd MMM yyyy, hh:mm a').format(now);
    final invoiceId = 'INV-${now.millisecondsSinceEpoch.toString().substring(7)}';

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.roll80,
        margin: const pw.EdgeInsets.all(20),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Center(
                child: pw.Column(
                  children: [
                    pw.Text('G FRESH SUPERMARKET',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 18)),
                    pw.Text('AI-Powered Smart Checkout', style: const pw.TextStyle(fontSize: 10)),
                    pw.SizedBox(height: 10),
                    pw.Divider(thickness: 1),
                  ],
                ),
              ),
              pw.SizedBox(height: 10),
              pw.Text('Invoice: $invoiceId', style: const pw.TextStyle(fontSize: 10)),
              pw.Text('Date: $dateStr', style: const pw.TextStyle(fontSize: 10)),
              pw.SizedBox(height: 10),
              pw.Divider(thickness: 0.5, borderStyle: pw.BorderStyle.dashed),
              pw.SizedBox(height: 10),

              // Table Header
              pw.Row(
                children: [
                  pw.Expanded(flex: 3, child: pw.Text('Item', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
                  pw.Expanded(flex: 1, child: pw.Text('Qty', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
                  pw.Expanded(flex: 1, child: pw.Text('Total', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10), textAlign: pw.TextAlign.right)),
                ],
              ),
              pw.SizedBox(height: 5),

              // Items
              ...items.map((item) => pw.Padding(
                padding: const pw.EdgeInsets.symmetric(vertical: 2),
                child: pw.Row(
                  children: [
                    pw.Expanded(
                      flex: 3,
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(item.product.name, style: const pw.TextStyle(fontSize: 9)),
                          pw.Text('Price: ₹${item.product.price}', style: pw.TextStyle(fontSize: 7, color: PdfColors.grey700)),
                        ],
                      )
                    ),
                    pw.Expanded(flex: 1, child: pw.Text('x${item.quantity}', style: const pw.TextStyle(fontSize: 9))),
                    pw.Expanded(
                      flex: 1,
                      child: pw.Text('₹${(item.product.price * item.quantity).toStringAsFixed(2)}',
                        style: const pw.TextStyle(fontSize: 9), textAlign: pw.TextAlign.right)
                    ),
                  ],
                ),
              )),

              pw.SizedBox(height: 15),
              pw.Divider(thickness: 1),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('TOTAL AMOUNT', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
                  pw.Text('₹${total.toStringAsFixed(2)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
                ],
              ),
              pw.SizedBox(height: 20),
              pw.Center(
                child: pw.Text('Thank you for shopping with G Fresh!',
                  style: pw.TextStyle(fontStyle: pw.FontStyle.italic, fontSize: 8)),
              ),
              pw.Center(
                child: pw.Text('Eco-friendly Digital Receipt',
                  style: pw.TextStyle(fontSize: 7, color: PdfColors.grey600)),
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Receipt-$invoiceId',
    );
  }
}
