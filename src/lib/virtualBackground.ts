import { ImageSegmenter, FilesetResolver, type ImageSegmenterResult } from "@mediapipe/tasks-vision";

// Real-time virtual background for video calls: selfie segmentation (MediaPipe)
// composited on a canvas, exposed as a processed MediaStream. Fully defensive —
// if the model can't load or a frame fails, it passes the raw camera through so
// a call is NEVER broken by this feature.

export type BgMode =
  | { kind: "none" }
  | { kind: "blur"; intensity: number } // 1..10
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }; // animated / looping video background (Effects)

const WASM_ROOT = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite";

export class VirtualBackgroundProcessor {
  private video = document.createElement("video");
  private canvas = document.createElement("canvas");
  private ctx: CanvasRenderingContext2D;
  private maskCanvas = document.createElement("canvas");
  private maskCtx: CanvasRenderingContext2D;
  private segmenter: ImageSegmenter | null = null;
  private raf = 0;
  private running = false;
  private mode: BgMode = { kind: "none" };
  private bgImage: HTMLImageElement | null = null;
  private bgVideo: HTMLVideoElement | null = null;
  private out: MediaStream;
  /** Set true if the model's person/background categories come out inverted. */
  personIsCategoryZero = false;

  private constructor(sourceTrack: MediaStreamTrack) {
    const s = sourceTrack.getSettings();
    const w = s.width ?? 640;
    const h = s.height ?? 480;
    this.canvas.width = w;
    this.canvas.height = h;
    this.maskCanvas.width = w;
    this.maskCanvas.height = h;
    this.ctx = this.canvas.getContext("2d")!;
    this.maskCtx = this.maskCanvas.getContext("2d", { willReadFrequently: true })!;
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = new MediaStream([sourceTrack]);
    this.out = this.canvas.captureStream(30);
  }

  static async create(sourceTrack: MediaStreamTrack, mode: BgMode): Promise<VirtualBackgroundProcessor> {
    const p = new VirtualBackgroundProcessor(sourceTrack);
    p.setMode(mode);
    await p.video.play().catch(() => {});
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
      p.segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
    } catch (e) {
      console.error("[VBG] segmenter failed to load — passing raw video:", e);
      p.segmenter = null;
    }
    p.running = true;
    p.raf = requestAnimationFrame(p.loop);
    return p;
  }

  get outputStream(): MediaStream {
    return this.out;
  }

  setMode(mode: BgMode) {
    this.mode = mode;
    // Tear down any previous background source.
    if (this.bgVideo) { this.bgVideo.pause(); this.bgVideo.srcObject = null; this.bgVideo = null; }
    this.bgImage = null;

    if (mode.kind === "image" && mode.url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { this.bgImage = img; };
      img.src = mode.url;
    } else if (mode.kind === "video" && mode.url) {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.src = mode.url;
      v.play().then(() => { this.bgVideo = v; }).catch(() => { this.bgVideo = null; });
    }
  }

  private blurPx(): number {
    const i = this.mode.kind === "blur" ? this.mode.intensity : 5;
    return Math.max(2, Math.min(24, i * 2.5));
  }

  private loop = () => {
    if (!this.running) return;
    const { video, ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    if (video.readyState >= 2) {
      if (!this.segmenter || this.mode.kind === "none") {
        ctx.filter = "none";
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(video, 0, 0, w, h);
      } else {
        try {
          this.segmenter.segmentForVideo(video, performance.now(), (res) => this.composite(res));
        } catch {
          ctx.filter = "none";
          ctx.drawImage(video, 0, 0, w, h);
        }
      }
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private composite(res: ImageSegmenterResult) {
    const { ctx, maskCtx, video, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const mask = res.categoryMask;
    if (!mask) {
      ctx.drawImage(video, 0, 0, w, h);
      return;
    }
    const data = mask.getAsUint8Array();
    const id = maskCtx.createImageData(w, h);
    for (let i = 0; i < data.length; i++) {
      const isPerson = this.personIsCategoryZero ? data[i] === 0 : data[i] > 0;
      id.data[i * 4 + 3] = isPerson ? 255 : 0; // alpha channel = person silhouette
    }
    maskCtx.putImageData(id, 0, 0);
    mask.close();

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    // Person (sharp): paint the silhouette, then keep only the video inside it.
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.maskCanvas, 0, 0, w, h);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(video, 0, 0, w, h);
    // Background behind: replacement image, looping video, or blurred camera.
    ctx.globalCompositeOperation = "destination-over";
    ctx.filter = "none";
    if (this.mode.kind === "image" && this.bgImage) {
      ctx.drawImage(this.bgImage, 0, 0, w, h);
    } else if (this.mode.kind === "video" && this.bgVideo && this.bgVideo.readyState >= 2) {
      ctx.drawImage(this.bgVideo, 0, 0, w, h);
    } else {
      ctx.filter = `blur(${this.blurPx()}px)`;
      ctx.drawImage(video, 0, 0, w, h);
    }
    ctx.restore();
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    try { this.segmenter?.close(); } catch { /* noop */ }
    this.out.getTracks().forEach((t) => t.stop());
    this.video.srcObject = null;
  }
}
