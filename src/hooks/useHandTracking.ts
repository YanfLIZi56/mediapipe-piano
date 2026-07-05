import { useEffect, useRef, useState, useCallback } from 'react';

// MediaPipe 通过 CDN 加载，使用全局变量
declare const Hands: any;
declare const Camera: any;

export interface FingerPosition {
  x: number;
  y: number;
}

export interface HandTrackingState {
  leftIndex: FingerPosition | null;
  rightIndex: FingerPosition | null;
  isReady: boolean;
  error: string | null;
}

// 手部骨骼连接关系（MediaPipe 21个关键点的连接线）
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // 拇指
  [0, 5], [5, 6], [6, 7], [7, 8],       // 食指
  [5, 9], [9, 10], [10, 11], [11, 12],  // 中指
  [9, 13], [13, 14], [14, 15], [15, 16],// 无名指
  [13, 17], [17, 18], [18, 19], [19, 20],// 小指
  [0, 17],                               // 手掌底边
];

function drawHandOnCanvas(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; z: number }[],
  canvasWidth: number,
  canvasHeight: number,
  color: string,
) {
  // 画骨骼连接线
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  for (const [a, b] of HAND_CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    ctx.beginPath();
    // 视频镜像翻转，x坐标需要反转
    ctx.moveTo((1 - pa.x) * canvasWidth, pa.y * canvasHeight);
    ctx.lineTo((1 - pb.x) * canvasWidth, pb.y * canvasHeight);
    ctx.stroke();
  }

  // 画关节节点
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const cx = (1 - lm.x) * canvasWidth;
    const cy = lm.y * canvasHeight;

    // 指尖（4,8,12,16,20）用更大的圆
    const isTip = [4, 8, 12, 16, 20].includes(i);
    // 食指尖（8）特殊高亮
    const isIndex = i === 8;

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, isIndex ? 8 : isTip ? 6 : 4, 0, Math.PI * 2);

    if (isIndex) {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 外圈发光
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (isTip) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
    }
  }
}

export function useHandTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const [state, setState] = useState<HandTrackingState>({
    leftIndex: null,
    rightIndex: null,
    isReady: false,
    error: null,
  });

  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const smoothRef = useRef({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  });
  const hasLeftRef = useRef(false);
  const hasRightRef = useRef(false);

  const onResults = useCallback(
    (results: any) => {
      // 清空并绘制 canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks && results.multiHandedness) {
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
              const landmarks = results.multiHandLandmarks[i];
              const handedness = results.multiHandedness[i];
              // MediaPipe 镜像：Left label 实际是用户右手 → 橙色；Right label 实际左手 → 青色
              const color = handedness.label === 'Left' ? '#FF6600' : '#00FFCC';
              drawHandOnCanvas(ctx, landmarks, canvas.width, canvas.height, color);
            }
          }
        }
      }

      let leftIndex: FingerPosition | null = null;
      let rightIndex: FingerPosition | null = null;

      if (results.multiHandLandmarks && results.multiHandedness) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
          const landmarks = results.multiHandLandmarks[i];
          const handedness = results.multiHandedness[i];
          const tip = landmarks[8];
          const pos = { x: tip.x, y: tip.y };
          if (handedness.label === 'Left') {
            rightIndex = pos;
          } else {
            leftIndex = pos;
          }
        }
      }

      // 弹簧平滑插值
      const smoothFactor = 0.35;
      const s = smoothRef.current;

      if (leftIndex) {
        if (hasLeftRef.current) {
          s.left.x += (leftIndex.x - s.left.x) * smoothFactor;
          s.left.y += (leftIndex.y - s.left.y) * smoothFactor;
        } else {
          s.left.x = leftIndex.x;
          s.left.y = leftIndex.y;
          hasLeftRef.current = true;
        }
        leftIndex = { x: s.left.x, y: s.left.y };
      } else {
        hasLeftRef.current = false;
      }

      if (rightIndex) {
        if (hasRightRef.current) {
          s.right.x += (rightIndex.x - s.right.x) * smoothFactor;
          s.right.y += (rightIndex.y - s.right.y) * smoothFactor;
        } else {
          s.right.x = rightIndex.x;
          s.right.y = rightIndex.y;
          hasRightRef.current = true;
        }
        rightIndex = { x: s.right.x, y: s.right.y };
      } else {
        hasRightRef.current = false;
      }

      setState((prev) => ({
        ...prev,
        leftIndex,
        rightIndex,
        isReady: true,
      }));
    },
    [canvasRef],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const waitForScripts = () => {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (typeof Hands !== 'undefined' && typeof Camera !== 'undefined') {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    let cancelled = false;

    waitForScripts().then(() => {
      if (cancelled) return;

      const hands = new Hands({
        locateFile: (file: string) =>
          `/mediapipe/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(onResults);
      handsRef.current = hands;

      const camera = new Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 1280,
        height: 720,
      });

      camera.start().then(() => {
        if (!cancelled) {
          setState((prev) => ({ ...prev, isReady: true }));
        }
      }).catch((err: Error) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            error: '摄像头启动失败，请检查设备或浏览器设置',
          }));
          console.error('Camera error:', err);
        }
      });

      cameraRef.current = camera;
    });

    return () => {
      cancelled = true;
      if (cameraRef.current) cameraRef.current.stop();
      if (handsRef.current) handsRef.current.close();
    };
  }, [videoRef, onResults]);

  return state;
}