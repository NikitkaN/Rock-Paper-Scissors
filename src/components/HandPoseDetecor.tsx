import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
// import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-core';
// import { MediaPipeHands } from '@tensorflow-models/hand-pose-detection';
import '@mediapipe/hands';
import Webcam from 'react-webcam';
import '@tensorflow/tfjs-backend-webgl';
// import { drawHand } from '../utilities';

const HandPoseDetector: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gesture, setGesture] = useState<string | null>(null);

  const determineGesture = (keypoints: handPoseDetection.Keypoint[]) => {
    const thumbTip = keypoints.find(kp => kp.name === 'thumb_tip');
    const indexFingerTip = keypoints.find(kp => kp.name === 'index_finger_tip');
    const middleFingerTip = keypoints.find(kp => kp.name === 'middle_finger_tip');
    const ringFingerTip = keypoints.find(kp => kp.name === 'ring_finger_tip');
    const pinkyTip = keypoints.find(kp => kp.name === 'pinky_tip');

    if (thumbTip && indexFingerTip && middleFingerTip && ringFingerTip && pinkyTip) {
      const isRock = middleFingerTip.y > indexFingerTip.y &&
                     ringFingerTip.y > indexFingerTip.y &&
                     pinkyTip.y > indexFingerTip.y;
      const isScissors = middleFingerTip.y < indexFingerTip.y &&
                         ringFingerTip.y < pinkyTip.y &&
                         thumbTip.y > indexFingerTip.y;
      const isPaper = Math.abs(indexFingerTip.y - pinkyTip.y) < 10 &&
                      Math.abs(thumbTip.y - ringFingerTip.y) < 10;

      if (isRock) return 'Камень';
      if (isScissors) return 'Ножницы';
      if (isPaper) return 'Бумага';
    }

    return 'Неопределено';
  };

  const drawKeypoints = (keypoints: handPoseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
    keypoints.forEach(keypoint => {
      const { x, y } = keypoint;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });
  };

  const detectHand = useCallback(async (detector: handPoseDetection.HandDetector) => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Настраиваем размеры канваса
      const canvas = canvasRef.current!;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, videoWidth, videoHeight);
    //   const estimateConfig = {staticImageMode: true}
      const estimateConfig = {flipHorizontal: false};
      const hands = await detector.estimateHands(video, estimateConfig);

      if (hands.length > 0) {
        const hand = hands[0];

        console.log(hand);
        const gesture = determineGesture(hand.keypoints);
        setGesture(gesture);
        drawKeypoints(hand.keypoints, ctx);

        // if (canvasRef.current) {
        //   const ctx = canvasRef.current.getContext("2d");
        //   drawHand(hand, ctx);
        // }
      }
    }

    requestAnimationFrame(() => detectHand(detector));
  }, []);

  useEffect(() => {
    const runHandPoseDetection = async () => {
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'mediapipe' as const,
        // runtime: 'tfjs' as const,
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands`,
        // solutionPath: `./node_modules/@mediapipe/hands`,
        // wasmPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_simd_wasm_bin.wasm`,
        // wasmPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_simd_wasm_bin.wasm`,
        maxHands: 2
      };
      const detector = await handPoseDetection.createDetector(model, detectorConfig);
    //   setInterval(() => {
        detectHand(detector);
    //   }, 100)
    };

    runHandPoseDetection();
  }, [detectHand]);

  return (
    <div>
      <Webcam
        ref={webcamRef}
        // mirrored={true}
        style={{
            position: "absolute",
            width: 640,
            height: 480,
        }}/>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          // marginLeft: "auto",
          // marginRight: "auto",
          // left: 0,
          // right: 0,
          // textAlign: "center",
          // zindex: 9,
          width: 640,
          height: 480,
        }}
      />

      <div style={{ position: 'relative', top: 500 }}>Распознанный жест: {gesture}</div>
    </div>
  );
};

export default HandPoseDetector;
