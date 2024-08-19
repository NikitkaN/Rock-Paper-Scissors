import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
// import * as handpose from '@tensorflow-models/handpose';
import * as fp from 'fingerpose';
import { Coords3D } from '@tensorflow-models/handpose/dist/pipeline';
// import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-core';
import '@mediapipe/hands';
import Webcam from 'react-webcam';
import '@tensorflow/tfjs-backend-webgl';

const HandPoseDetector: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gesture, setGesture] = useState<string | null>(null);

  const drawKeypoints = (keypoints: handPoseDetection.Keypoint[], ctx: CanvasRenderingContext2D) => {
  // const drawKeypoints = (keypoints: number[][], ctx: CanvasRenderingContext2D) => {
    keypoints.forEach(keypoint => {
      const { x, y } = keypoint;
    // keypoints.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    });
  };

  const detectHand = useCallback(async (detector: handPoseDetection.HandDetector) => {
    // const detectHand = useCallback(async (model: handpose.HandPose) => {
    if (
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const canvas = canvasRef.current!;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, videoWidth, videoHeight);
      // const predictions = await model.estimateHands(video);

    //   const estimateConfig = {staticImageMode: true}
      const estimateConfig = {flipHorizontal: false};
      const hands = await detector.estimateHands(video, estimateConfig);
      // const hands = await detector.estimateHands(video, true);

      // console.log('Hands detected:', hands);

      if (hands.length > 0) {
        const hand = hands[0];

        // const keypoints3D = hand.landmarks.map(([x, y, z]) => ({
        //   x,
        //   y,
        //   z,
        //   // score: 1.0, // Задаем значение score, если необходимо
        // }));

        // setGesture(gesture);
        drawKeypoints(hand.keypoints, ctx);

        if (hand.keypoints3D) {

          // const keypoints3D = hand.keypoints3D?.map(({x, y, z = 0}) => ({
          //   x,
          //   y,
          //   z,
          // })) || [];

          const landmark = hand.keypoints3D.map(
            (value) => [
              value.x,
              value.y,
              value.z,
            ]
          );

          // console.log('Keypoints3D:', hand.keypoints3D);
          console.log('landmark:', landmark);

          const gestureEstimator = new fp.GestureEstimator([
            // fp.Gestures.VictoryGesture,
            fp.Gestures.ThumbsUpGesture,
            rockGesture,
            scissorsGesture,
            paperGesture,
          ]);

          console.log('Gesture Estimator Initialized', gestureEstimator);
  
          // const estimatedGestures = gestureEstimator.estimate(keypoints3D, 9);
          // if (keypoints3D.every(kp => kp.z !== undefined)) {
            const estimatedGestures = await gestureEstimator.estimate(landmark, 9);

            console.log('Estimated Gestures:', estimatedGestures);

            if (estimatedGestures.gestures.length > 0) {
              const maxConfidenceGesture = estimatedGestures.gestures.reduce((prev, current) =>
                prev.score > current.score ? prev : current
              );
              console.log('Max Confidence Gesture:', maxConfidenceGesture);
              
              // setGesture(maxConfidenceGesture.name);
              switch (maxConfidenceGesture.name) {
                case 'thumbs_up':
                  setGesture('👍');
                  break;
                case 'rock':
                  setGesture('✊');
                  break;
                case 'scissors':
                  setGesture('✌');
                  break;
                case 'paper':
                  setGesture('✋');
                  break;
                default:
                  '?'
              }
            } else {
              console.log('No gestures recognized');
            }
          // } else {
          //   console.warn("Incomplete keypoints data.");
          // }
        }
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
        maxHands: 1
      };
      const detector = await handPoseDetection.createDetector(model, detectorConfig);
      detectHand(detector);
    };

    runHandPoseDetection();
  }, [detectHand]);

  // useEffect(() => {
  //   const runHandPoseDetection = async () => {
  //     const model = await handpose.load();
  //     detectHand(model);
  //   };

  //   runHandPoseDetection();
  // }, [detectHand]);

  // Определение пользовательских жестов для Камень, Ножницы и Бумага
  const rockGesture = new fp.GestureDescription('rock');
  // Зажатые пальцы для Камня
  rockGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.HalfCurl, 1.0);
  rockGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
  rockGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
  rockGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
  rockGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  rockGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);

  const scissorsGesture = new fp.GestureDescription('scissors');
  // Сжатый кулак с выпрямленными указательным и средним пальцами для Ножниц
  // scissorsGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.FullCurl, 1.0);
  scissorsGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  scissorsGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  scissorsGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.FullCurl, 1.0);
  scissorsGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.HalfCurl, 1.0);
  scissorsGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.FullCurl, 1.0);
  scissorsGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.HalfCurl, 1.0);

  const paperGesture = new fp.GestureDescription('paper');
  // Все пальцы выпрямлены для Бумаги
  paperGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
  paperGesture.addCurl(fp.Finger.Index, fp.FingerCurl.NoCurl, 1.0);
  paperGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.NoCurl, 1.0);
  paperGesture.addCurl(fp.Finger.Ring, fp.FingerCurl.NoCurl, 1.0);
  paperGesture.addCurl(fp.Finger.Pinky, fp.FingerCurl.NoCurl, 1.0);

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

      <div style={{ position: 'relative', top: 500, fontSize: 35 }}>Распознанный жест: {gesture}</div>
    </div>
  );
};

export default HandPoseDetector;
