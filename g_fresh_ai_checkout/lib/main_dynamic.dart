import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:open_file/open_file.dart';
import 'package:url_launcher/url_launcher.dart';

// Replace with your cloud backend URL (e.g., deployed on GCP/AWS/Heroku)
const String BACKEND_URL = "http://YOUR_CLOUD_IP:8000";

late List<CameraDescription> cameras;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  cameras = await availableCameras();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Dynamic Checkout',
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
  List<dynamic> _cartItems = [];
  double _totalAmount = 0.0;
  String _statusMessage = "Point camera at product labels";

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
      _statusMessage = "Capturing & Uploading to Cloud AI...";
    });

    try {
      final XFile image = await _controller!.takePicture();
      
      // Upload to Cloud Backend for Dynamic Processing
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$BACKEND_URL/scan-and-detect'),
      );
      request.files.add(await http.MultipartFile.fromPath('file', image.path));

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        var data = json.decode(response.body);
        setState(() {
          _cartItems = data['items'];
          _totalAmount = _cartItems.fold(
            0.0,
            (sum, item) => sum + (item['price'] * item['quantity']),
          );
          _statusMessage = "Detected: ${_cartItems.length} items";
        });
        _showResultsDialog();
      } else {
        var errorData = json.decode(response.body);
        setState(() {
          _statusMessage = "Error: ${errorData['detail']}";
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = "Connection Error: $e";
      });
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  void _showResultsDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Products Detected"),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _cartItems.length,
            itemBuilder: (ctx, i) => ListTile(
              leading: const Icon(Icons.shopping_bag, color: Colors.green),
              title: Text("${_cartItems[i]['brand']} - ${_cartItems[i]['name']}"),
              subtitle: Text("Qty: ${_cartItems[i]['quantity']} | \$${_cartItems[i]['price']}"),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _checkout();
            },
            child: const Text("Confirm & Send WhatsApp"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text("Close"),
          ),
        ],
      ),
    );
  }

  Future<void> _checkout() async {
    if (_cartItems.isEmpty) return;

    setState(() {
      _statusMessage = "Generating PDF & Sending WhatsApp...";
    });

    try {
      // Call Checkout Endpoint
      final response = await http.post(
        Uri.parse('$BACKEND_URL/checkout'),
        headers: {"Content-Type": "application/json"},
        body: json.encode({
          "items": _cartItems,
          "whatsapp_number": "+1234567890" // Replace with customer input
        }),
      );

      if (response.statusCode == 200) {
        setState(() {
          _statusMessage = "Receipt sent to WhatsApp successfully!";
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Checkout Complete!")),
        );
        setState(() {
          _cartItems = [];
          _totalAmount = 0.0;
        });
      }
    } catch (e) {
      setState(() {
        _statusMessage = "Checkout Failed: $e";
      });
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller == null || !_controller!.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    return Scaffold(
      appBar: AppBar(title: const Text("AI Dynamic Scanner")),
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
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}