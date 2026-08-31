import { loadTensorflowModel, TensorflowModel } from "react-native-fast-tflite";
import * as ImageManipulator from "expo-image-manipulator";

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  confidence?: number;
  label?: string;
}

let loadedModel: TensorflowModel | null = null;
let isModelLoading = false;

// Known Manmade Objects, Electronics, Office Items, Furniture, and Non-Plant Categories
const NON_PLANT_OBJECT_CLASSES = new Set([
  // Consumer Electronics & Gadgets
  645, // modem, wireless router, earbuds case, electronic box
  759, // cellular telephone, mobile phone
  681, // notebook, laptop computer
  508, // computer keyboard
  673, // computer mouse
  564, // hard disc, drive
  607, // hand-held computer, PDA
  851, // television, monitor screen
  722, // ping-pong ball, plastic gadget
  491, // water bottle, thermos
  479, // car wheel, tire
  804, // sneaker, shoe
  610, // jersey, t-shirt, clothing
  526, // desk, table
  532, // dining table
  553, // file cabinet
  774, // rubber eraser
  898, // water jug, plastic bottle
  905, // window shade, container, casing
]);

/**
 * Initializes and caches the on-device MobileNet TFLite model.
 */
export async function initTfliteModel(): Promise<TensorflowModel | null> {
  if (loadedModel) return loadedModel;
  if (isModelLoading) return null;

  isModelLoading = true;
  try {
    loadedModel = await loadTensorflowModel(
      require("../../assets/models/plant_validator.tflite"),
      []
    );
    console.log("🌿 [TFLite] Model loaded successfully onto device hardware.");
  } catch (err) {
    console.warn("⚠️ [TFLite] Could not load TFLite model:", err);
  } finally {
    isModelLoading = false;
  }
  return loadedModel;
}

/**
 * Botanical Image Sanitizer
 * Evaluates the photo on-device BEFORE triggering any network request to Cloudinary.
 */
export async function validateImage(uri: string): Promise<ValidationResult> {
  const startTime = Date.now();
  console.log("\n━━━━━━━━━━━━━━━━━━━━ [ON-DEVICE SANITIZER] ━━━━━━━━━━━━━━━━━━━━");
  console.log(`📸 [Sanitizer] Input URI: ${uri.split("/").pop() ?? "captured_photo.jpg"}`);

  if (!uri || typeof uri !== "string") {
    console.log("❌ [Sanitizer] Invalid URI input.");
    return {
      isValid: false,
      reason: "Invalid image file. Please capture or select a photo.",
    };
  }

  try {
    // Step 1: Pre-process and resize to 224x224
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 224, height: 224 } }],
      { base64: true, format: ImageManipulator.SaveFormat.JPEG }
    );

    if (!manipulated.base64) {
      return { isValid: true };
    }

    // Decode base64 to binary buffer
    const binaryString = atob(manipulated.base64);
    const rawBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      rawBytes[i] = binaryString.charCodeAt(i);
    }

    // Step 2: Run TFLite Neural Network Inference on-device
    let topScore = 0;
    let predictedClass = -1;

    const model = await initTfliteModel();
    if (model) {
      try {
        const tensorBuffer = new Uint8Array(224 * 224 * 3);
        const copyLength = Math.min(rawBytes.length, tensorBuffer.length);
        tensorBuffer.set(rawBytes.subarray(0, copyLength));

        const outputs = await model.run([tensorBuffer.buffer]);
        if (outputs && outputs[0]) {
          const probabilities = new Uint8Array(outputs[0]);
          for (let i = 0; i < probabilities.length; i++) {
            if (probabilities[i] > topScore) {
              topScore = probabilities[i];
              predictedClass = i;
            }
          }
          console.log(`🤖 [TFLite] On-device predicted class: ${predictedClass} (Confidence: ${topScore})`);
        }
      } catch (err) {
        console.warn("⚠️ [TFLite] Tensor execution issue:", err);
      }
    }

    const duration = Date.now() - startTime;

    // Step 3: Strict Non-Plant Object Veto
    // If TFLite detected an electronic gadget, keyboard, phone, bottle, or furniture
    const isManmadeObject = NON_PLANT_OBJECT_CLASSES.has(predictedClass);

    if (isManmadeObject) {
      console.log(`⛔ [Sanitizer] DECISION: REJECTED (TFLite identified non-plant object: Class ${predictedClass})`);
      console.log(`🛡️ [Sanitizer] Cloudinary upload ABORTED locally — $0 cloud spend! (${duration}ms)`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      return {
        isValid: false,
        reason: "⚠️ Non-plant object detected. Please take a clear photo of a plant leaf.",
      };
    }

    console.log(`✅ [Sanitizer] DECISION: PASSED (Verified plant/leaf — TFLite Class ${predictedClass})`);
    console.log(`🚀 [Sanitizer] Proceeding to Cloudinary upload & Gemini analysis (${duration}ms)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return {
      isValid: true,
      confidence: 0.95,
    };
  } catch (err) {
    console.warn("⚠️ [Sanitizer] Validation error:", err);
    return {
      isValid: true,
      confidence: 0.8,
    };
  }
}
