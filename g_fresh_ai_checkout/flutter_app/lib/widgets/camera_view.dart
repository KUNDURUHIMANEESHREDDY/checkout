import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:permission_handler/permission_handler.dart';
import '../providers/scan_provider.dart';

class CameraView extends ConsumerStatefulWidget {
  const CameraView({super.key});

  @override
  ConsumerState<CameraView> createState() => _CameraViewState();
}

class _CameraViewState extends ConsumerState<CameraView> with SingleTickerProviderStateMixin {
  CameraController? _controller;
  late AnimationController _animationController;
  bool _isCameraInitialized = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _checkPermissionsAndInit();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  Future<void> _checkPermissionsAndInit() async {
    final status = await Permission.camera.request();
    if (status.isGranted) {
      _initializeCamera();
    } else {
      setState(() {
        _errorMessage = 'Camera permission denied. Please enable it in settings.';
      });
    }
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() => _errorMessage = 'No cameras found on this device.');
        return;
      }

      _controller = CameraController(
        cameras[0],
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid ? ImageFormatGroup.nv21 : ImageFormatGroup.bgra8888,
      );

      await _controller?.initialize();
      _controller?.startImageStream((image) => _processCameraImage(image));
      if (mounted) {
        setState(() => _isCameraInitialized = true);
      }
    } catch (e) {
      debugPrint('Camera Initialization Error: $e');
      setState(() => _errorMessage = 'Camera Error: ${e.toString()}');
    }
  }

  void _processCameraImage(CameraImage image) {
    // Throttle processing if already busy handled in provider
    try {
      final WriteBuffer allBytes = WriteBuffer();
      for (final Plane plane in image.planes) {
        allBytes.putUint8List(plane.bytes);
      }
      final bytes = allBytes.done().buffer.asUint8List();

      final Size imageSize = Size(image.width.toDouble(), image.height.toDouble());
      final InputImageRotation imageRotation = InputImageRotation.rotation90deg;
      final InputImageFormat inputImageFormat = Platform.isAndroid ? InputImageFormat.nv21 : InputImageFormat.bgra8888;

      final inputImageMetadata = InputImageMetadata(
        size: imageSize,
        rotation: imageRotation,
        format: inputImageFormat,
        bytesPerRow: image.planes[0].bytesPerRow,
      );

      final inputImage = InputImage.fromBytes(
        bytes: bytes,
        metadata: inputImageMetadata,
      );

      ref.read(scanNotifierProvider.notifier).processImage(inputImage);
    } catch (e) {
      debugPrint('Processing Frame Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.redAccent, size: 64),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 16),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  setState(() => _errorMessage = null);
                  _checkPermissionsAndInit();
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                child: const Text('Try Again', style: TextStyle(color: Colors.black)),
              ),
            ],
          ),
        ),
      );
    }

    if (!_isCameraInitialized || _controller == null) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Color(0xFF10B981)),
            SizedBox(height: 16),
            Text('Initializing AI Vision...', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        SizedBox.expand(
          child: FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _controller!.value.previewSize?.height ?? 100,
              height: _controller!.value.previewSize?.width ?? 100,
              child: CameraPreview(_controller!),
            ),
          ),
        ),

        // Scanning Laser (Full Screen)
        AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return Positioned(
              top: _animationController.value * MediaQuery.of(context).size.height,
              left: 0,
              right: 0,
              child: Container(
                height: 3,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.5),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF10B981).withOpacity(0.4),
                      blurRadius: 15,
                      spreadRadius: 5,
                    ),
                  ],
                ),
              ),
            );
          },
        ),

        // Corner Indicators for aesthetic
        Positioned(
          top: 40,
          left: 20,
          child: _buildCorner(top: true, left: true),
        ),
        Positioned(
          top: 40,
          right: 20,
          child: _buildCorner(top: true, left: false),
        ),
        Positioned(
          bottom: 120,
          left: 20,
          child: _buildCorner(top: false, left: true),
        ),
        Positioned(
          bottom: 120,
          right: 20,
          child: _buildCorner(top: false, left: false),
        ),

        // Hint Text
        const Positioned(
          top: 100,
          left: 0,
          right: 0,
          child: Text(
            'AI SCANNING ACTIVE',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              letterSpacing: 3,
              fontSize: 12,
              shadows: [Shadow(color: Colors.black, blurRadius: 10)],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCorner({required bool top, required bool left}) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        border: Border(
          top: top ? const BorderSide(color: Color(0xFF10B981), width: 4) : BorderSide.none,
          bottom: !top ? const BorderSide(color: Color(0xFF10B981), width: 4) : BorderSide.none,
          left: left ? const BorderSide(color: Color(0xFF10B981), width: 4) : BorderSide.none,
          right: !left ? const BorderSide(color: Color(0xFF10B981), width: 4) : BorderSide.none,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    _animationController.dispose();
    super.dispose();
  }
}
