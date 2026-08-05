import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import '../models/product.dart';
import '../utils/ai_extractor.dart';

late List<CameraDescription> cameras;
late List<Product> localProducts;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  cameras = await availableCameras();
  
  // Load local products
  final String localData = await rootBundle.loadString('assets/data/products.json');
  final List<dynamic> localJson = json.decode(localData);
  localProducts = localJson.map((j) => Product.fromFirestore(j, j['id'])).toList();
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Local Checkout',
      theme: ThemeData(primarySwatch: Colors.green),
      home: const ScanScreen(),
    );
  }
}

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  CameraController? _controller;
  bool _isProcessing = false;
  List<Product> _cartItems = [];
  double _totalAmount = 0.0;
  String _statusMessage = "Point camera at product labels";
  final TextRecognizer _textRecognizer = TextRecognizer();

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  void _initializeCamera() {
    _controller = CameraController(cameras[0], ResolutionPreset.medium);
    _controller!.initialize().then((_) {
      if (!mounted) return;
      setState(() {});
    });
  }

  Future<void> _captureAndScan() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
      _statusMessage = "Processing with Local AI...";
    });

    try {
      // Capture image
      final XFile image = await _controller!.takePicture();
      
      // Load image for OCR
      final imageFile = File(image.path);
      final imageBytes = await imageFile.readAsBytes();
      final imageImage = await decodeImageFromList(imageBytes);
      
      // Create InputImage for ML Kit
      final inputImage = InputImage.fromBytes(
        bytes: imageBytes,
        inputImageFormat: InputImageFormat.jpeg,
        metadata: InputImageMetadata(
          size: Size(imageImage.image.width.toDouble(), imageImage.image.height.toDouble()),
          rotation: InputImageRotation.rotation0,
          inputImageFormat: InputImageFormat.jpeg,
          planeData: imageImage.image.planes.map((plane) {
            return InputImagePlaneMetadata(
              bytesPerRow: plane.bytesPerRow,
              height: plane.height,
              width: plane.width,
            );
          }).toList(),
        ),
      );

      // Process with LOCAL AI (Google ML Kit OCR)
      final recognizedText = await _textRecognizer.processImage(inputImage);
      
      // Use local AI extractor to match products
      final result = AIExtractor.processFrame(recognizedText, localProducts);
      
      setState(() {
        if (result.matchedProduct != null) {
          _cartItems.add(result.matchedProduct!);
          _totalAmount = _cartItems.fold(
            0.0,
            (sum, item) => sum + item.price,
          );
          _statusMessage = "Detected: ${result.matchedProduct!.shortName}";
          _showResultsDialog(result);
        } else {
          _statusMessage = "No product matched. Try again.";
          if (result.rawOcrInfo.brand.isNotEmpty) {
            _statusMessage += " (Found: ${result.rawOcrInfo.brand})";
          }
        }
      });

    } catch (e) {
      setState(() {
        _statusMessage = "Error: $e";
      });
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  void _showResultsDialog(AIExtractionResult result) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Product Detected"),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (result.matchedProduct != null) ...[
                ListTile(
                  leading: const Icon(Icons.shopping_bag, color: Colors.green),
                  title: Text("${result.matchedProduct!.brand} - ${result.matchedProduct!.shortName}"),
                  subtitle: Text("${result.matchedProduct!.variant} | \$${result.matchedProduct!.price.toStringAsFixed(2)}"),
                ),
                const Divider(),
                Text("Confidence: ${(result.confidenceScore * 100).toStringAsFixed(1)}%"),
                if (result.rawOcrInfo.brand.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text("Brand: ${result.rawOcrInfo.brand}", style: const TextStyle(fontSize: 12)),
                ],
                if (result.rawOcrInfo.productName.isNotEmpty) ...[
                  Text("Product: ${result.rawOcrInfo.productName}", style: const TextStyle(fontSize: 12)),
                ],
                if (result.rawOcrInfo.quantity.isNotEmpty) ...[
                  Text("Quantity: ${result.rawOcrInfo.quantity}", style: const TextStyle(fontSize: 12)),
                ],
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _checkout();
            },
            child: const Text("Confirm & Generate Receipt"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Continue Scanning"),
          ),
        ],
      ),
    );
  }

  Future<void> _checkout() async {
    if (_cartItems.isEmpty) return;

    setState(() {
      _statusMessage = "Generating Receipt...";
    });

    try {
      // Generate local receipt
      final receiptContent = _generateReceiptText();
      
      // Save to file
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/receipt_${DateTime.now().millisecondsSinceEpoch}.txt');
      await file.writeAsString(receiptContent);
      
      setState(() {
        _statusMessage = "Receipt saved locally!";
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Receipt saved to: ${file.path}"),
          action: SnackBarAction(
            label: 'OPEN',
            onPressed: (() => OpenFile.open(file.path)),
          ),
        ),
      );
      
      // Clear cart
      setState(() {
        _cartItems = [];
        _totalAmount = 0.0;
      });
      
    } catch (e) {
      setState(() {
        _statusMessage = "Checkout Failed: $e";
      });
    }
  }

  String _generateReceiptText() {
    final now = DateTime.now();
    final invoiceId = "INV-${now.year}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}";
    
    final buffer = StringBuffer();
    buffer.writeln("=" * 50);
    buffer.writeln("G FRESH SUPERMARKET");
    buffer.writeln("AI-Powered Smart Checkout (Local)");
    buffer.writeln("=" * 50);
    buffer.writeln("");
    buffer.writeln("Invoice: $invoiceId");
    buffer.writeln("Date: ${now.toString()}");
    buffer.writeln("");
    buffer.writeln("-" * 50);
    buffer.writeln("ITEMS:");
    buffer.writeln("-" * 50);
    
    for (final item in _cartItems) {
      buffer.writeln("${item.brand} - ${item.shortName}");
      buffer.writeln("  Variant: ${item.variant}");
      buffer.writeln("  Price: \$${item.price.toStringAsFixed(2)}");
      buffer.writeln("");
    }
    
    buffer.writeln("-" * 50);
    buffer.writeln("TOTAL: \$${_totalAmount.toStringAsFixed(2)}");
    buffer.writeln("=" * 50);
    buffer.writeln("");
    buffer.writeln("Thank you for shopping at G Fresh!");
    buffer.writeln("Eco-friendly Digital Receipt");
    
    return buffer.toString();
  }

  @override
  void dispose() {
    _controller?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("AI Local Scanner"),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              setState(() {
                _cartItems = [];
                _totalAmount = 0.0;
                _statusMessage = "Cart cleared";
              });
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          CameraPreview(_controller!),
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.all(10),
                child: Text(
                  _statusMessage,
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Center(
              child: FloatingActionButton.large(
                onPressed: _isProcessing ? null : _captureAndScan,
                backgroundColor: Colors.greenAccent,
                child: Icon(_isProcessing ? Icons.hourglass_empty : Icons.camera_alt),
              ),
            ),
          ),
          if (_totalAmount > 0)
            Positioned(
              top: 50,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [BoxShadow(blurRadius: 10, color: Colors.black26)],
                ),
                child: Column(
                  children: [
                    const Text("Cart Total", style: TextStyle(fontWeight: FontWeight.bold)),
                    Text("\$${_totalAmount.toStringAsFixed(2)}", 
                        style: const TextStyle(fontSize: 24, color: Colors.green, fontWeight: FontWeight.bold)),
                    Text("Items: ${_cartItems.length}", style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
