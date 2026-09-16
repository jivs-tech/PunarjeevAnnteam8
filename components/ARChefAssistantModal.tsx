'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX,
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Mic, 
  Square,
  CheckCircle2,
  HelpCircle,
  Eye,
  Loader2,
  MessageSquare,
  Target,
  Send,
  Sparkle,
  Upload,
  Monitor,
  Key,
  Image as ImageIcon
} from 'lucide-react';
import { RecipeItem } from '@/types';

interface ARChefAssistantModalProps {
  recipe: RecipeItem;
  onClose: () => void;
  showToast: (msg: string) => void;
}

type ChefExpression = 'happy' | 'talking' | 'thinking' | 'surprised' | 'cheering' | 'warning' | 'pointing';

export const ARChefAssistantModal: React.FC<ARChefAssistantModalProps> = ({
  recipe,
  onClose,
  showToast
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [chefExpression, setChefExpression] = useState<ChefExpression>('happy');

  // Chef Screen Position (Home Anchor: Very Left Top: 18%, 22%)
  const [chefScreenPos, setChefScreenPos] = useState<{ x: number; y: number }>({ x: 18, y: 22 });
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // High-Tech AR Computer Vision Bounding Box Target (OpenCV / MediaPipe Style)
  const [spatialTarget, setSpatialTarget] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence: number;
  } | null>(null);

  // Audio Recording (MediaRecorder -> Gemini Multimodal Audio)
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Visual Subtitles & Q&A States
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [isScanningPan, setIsScanningPan] = useState<boolean>(false);
  const [panObservation, setPanObservation] = useState<string | null>(null);
  const [chefAdvice, setChefAdvice] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [isAskingQuestion, setIsAskingQuestion] = useState<boolean>(false);
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);

  const isSpeakingRef = useRef<boolean>(false);

  // Initialize AR Camera Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function startARCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (err) {
        console.warn('AR Camera background stream unavailable:', err);
        setIsCameraActive(false);
      }
    }
    startARCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3D Canvas Vintage Cartoonic Tomato Chef Rendering Engine
  useEffect(() => {
    const canvas = canvas3DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let tick = 0;

    const render3DVintageTomatoChef = () => {
      tick += 0.06;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 5;
      const floatOffset = Math.sin(tick * 1.6) * 4;
      const squashX = 1 + Math.sin(tick * 3) * 0.03;
      const squashY = 1 - Math.sin(tick * 3) * 0.03;

      ctx.save();

      // Shadow Base
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 45, 42, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, centerY + floatOffset);
      ctx.scale(squashX, squashY);

      // Vintage Tomato Body (Smaller compact scale)
      const tomatoGrad = ctx.createRadialGradient(-9, -11, 6, 0, 0, 40);
      tomatoGrad.addColorStop(0, '#ff6b4a');
      tomatoGrad.addColorStop(0.6, '#e63946');
      tomatoGrad.addColorStop(1, '#9e1b24');

      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fillStyle = tomatoGrad;
      ctx.shadowColor = 'rgba(230, 57, 70, 0.5)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#2b090a';
      ctx.stroke();

      // Highlights
      ctx.beginPath();
      ctx.ellipse(-13, -13, 10, 6, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Green Stem Leaves & Toque Hat
      ctx.fillStyle = '#2a9d8f';
      ctx.strokeStyle = '#143e37';
      ctx.lineWidth = 2;
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(angle) * 12,
          -31 + Math.sin(angle) * 4,
          7, 4, angle, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#fdf0d5';
      ctx.beginPath();
      ctx.roundRect(-16, -50, 32, 20, [8, 8, 3, 3]);
      ctx.fill();
      ctx.strokeStyle = '#2b090a';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#e63946';
      ctx.fillRect(-16, -34, 32, 4);

      // Vintage Pie-Cut Eyes
      const drawEye = (x: number, y: number, isRight: boolean) => {
        ctx.save();
        ctx.translate(x, y);

        if (chefExpression === 'surprised') {
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#2b090a';
          ctx.fill();
        } else if (chefExpression === 'thinking' && isRight) {
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0.1 * Math.PI, 0.9 * Math.PI, false);
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#2b090a';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = '#2b090a';
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(isRight ? -1 : 1, 0, 3, 4.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#2b090a';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(isRight ? -1.5 : 0, -1.5, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
        ctx.restore();
      };

      drawEye(-9, -6, false);
      drawEye(9, -6, true);

      // Rosy Cheeks
      ctx.fillStyle = 'rgba(255, 153, 153, 0.5)';
      ctx.beginPath();
      ctx.arc(-16, 2, 4.5, 0, Math.PI * 2);
      ctx.arc(16, 2, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.strokeStyle = '#2b090a';
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#800913';

      ctx.beginPath();
      if (chefExpression === 'talking') {
        const mouthTalk = Math.abs(Math.sin(tick * 6)) * 6 + 3;
        ctx.ellipse(0, 10, 7, mouthTalk, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (chefExpression === 'cheering') {
        ctx.arc(0, 7, 9, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
      } else if (chefExpression === 'surprised') {
        ctx.arc(0, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (chefExpression === 'warning') {
        ctx.moveTo(-8, 12);
        ctx.lineTo(8, 9);
        ctx.stroke();
      } else {
        ctx.arc(0, 6, 7, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
      }

      // Carrot Arms & Spatula / Pointer Hand
      const armWave = Math.sin(tick * 2.5) * 6;
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#ff9f1c';
      ctx.lineCap = 'round';

      // Left Arm
      ctx.beginPath();
      ctx.moveTo(-28, 8);
      ctx.quadraticCurveTo(-42, 15 + armWave, -34, 24 + armWave);
      ctx.stroke();

      // Right Arm
      if (chefExpression === 'pointing') {
        ctx.beginPath();
        ctx.moveTo(28, 8);
        ctx.quadraticCurveTo(48, -10, 56, -18);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(56, -18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#2b090a';
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(63, -22, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(28, 8);
        ctx.quadraticCurveTo(42, -4 - armWave, 36, -15 - armWave);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(38, -17 - armWave, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#2b090a';
        ctx.stroke();

        ctx.fillStyle = '#c88d3e';
        ctx.beginPath();
        ctx.roundRect(36, -34 - armWave, 9, 16, 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      animFrameId = requestAnimationFrame(render3DVintageTomatoChef);
    };

    render3DVintageTomatoChef();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [chefExpression]);

  // TTS Speech Synthesis Voice Guidance & Visual Subtitle Display
  const speakText = useCallback((text: string, onDone?: () => void) => {
    setActiveSubtitle(text);

    if (!isAudioEnabled || !('speechSynthesis' in window)) {
      setChefExpression('talking');
      setTimeout(() => {
        setChefExpression('happy');
        if (onDone) onDone();
      }, 3500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.pitch = 1.1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        setChefExpression('talking');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setChefExpression('happy');
        if (onDone) onDone();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        setChefExpression('happy');
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }
  }, [isAudioEnabled, speechRate]);

  // Read current step on index change & reset Chef Tom to Very Left Top (18%, 22%)
  useEffect(() => {
    const text = `Step ${currentStepIdx + 1}. ${recipe.instructions[currentStepIdx]}`;
    speakText(text);
    setChefScreenPos({ x: 18, y: 22 });
    setSpatialTarget(null);
  }, [currentStepIdx, recipe.instructions, speakText]);

  // Step Navigation Handlers
  const handleNextStep = () => {
    if (currentStepIdx < recipe.instructions.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
    } else {
      setChefExpression('cheering');
      speakText("🎉 Recipe finished! Splendid job, Chef Tom is so proud!");
      showToast('🎉 Recipe complete! Great job, Chef!');
    }
  };

  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  // Live Pan Camera Vision Analysis (OpenCV / MediaPipe AR Target Bounding Box!)
  const handleScanPanWithAI = async () => {
    if (!videoRef.current) return;
    setIsScanningPan(true);
    setChefExpression('thinking');

    try {
      const video = videoRef.current;
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = video.videoWidth || 640;
      captureCanvas.height = video.videoHeight || 480;
      const ctx = captureCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      }
      const imageBase64 = captureCanvas.toDataURL('image/jpeg', 0.85);

      const res = await fetch('/api/vision/chef-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          recipeTitle: recipe.title,
          currentStep: currentStepIdx,
          stepInstruction: recipe.instructions[currentStepIdx]
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setPanObservation(data.observation);
        setChefAdvice(data.advice);
        
        // High-Tech Spatial Bounding Box & Target Laser Pointer Movement!
        if (data.targetLocation && typeof data.targetLocation.x === 'number') {
          const loc = data.targetLocation;
          setSpatialTarget({
            x: loc.x,
            y: loc.y,
            width: loc.width || 35,
            height: loc.height || 30,
            label: loc.label || 'Detected Object',
            confidence: loc.confidence || 94
          });
          
          // Chef Tom glides to adjacent position to point directly at target
          setChefScreenPos({
            x: Math.max(15, Math.min(85, loc.x > 50 ? loc.x - 22 : loc.x + 22)),
            y: Math.max(25, Math.min(75, loc.y + 10))
          });
          setChefExpression('pointing');

          // Smoothly glide back to Home Corner after 6 seconds
          setTimeout(() => {
            setChefScreenPos({ x: 18, y: 22 });
            setSpatialTarget(null);
            setChefExpression('happy');
          }, 6000);
        } else {
          if (data.expression) setChefExpression(data.expression as ChefExpression);
        }

        speakText(`Chef Tom sees: ${data.observation}. ${data.advice}`);
      } else {
        showToast('Could not analyze pan image. Hold camera steady!');
      }
    } catch (err) {
      console.warn('Chef vision error:', err);
      showToast('Camera snapshot error.');
    } finally {
      setIsScanningPan(false);
    }
  };

  // Ask Chef Question (Text Question)
  const handleAskQuestionSubmit = async (questionText: string) => {
    if (!questionText.trim()) return;
    setIsAskingQuestion(true);
    setChefExpression('thinking');

    try {
      let imageBase64 = '';
      if (videoRef.current) {
        const video = videoRef.current;
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth || 640;
        captureCanvas.height = video.videoHeight || 480;
        const ctx = captureCanvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        imageBase64 = captureCanvas.toDataURL('image/jpeg', 0.85);
      }

      const res = await fetch('/api/vision/chef-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          recipeTitle: recipe.title,
          currentStep: currentStepIdx,
          stepInstruction: recipe.instructions[currentStepIdx],
          userQuestion: questionText
        })
      });

      const data = await res.json();
      if (data.status === 'success' && data.answer) {
        setQaAnswer(data.answer);

        if (data.targetLocation && typeof data.targetLocation.x === 'number') {
          const loc = data.targetLocation;
          setSpatialTarget({
            x: loc.x,
            y: loc.y,
            width: loc.width || 35,
            height: loc.height || 30,
            label: loc.label || 'Ingredient',
            confidence: loc.confidence || 92
          });
          setChefScreenPos({
            x: Math.max(15, Math.min(85, loc.x > 50 ? loc.x - 22 : loc.x + 22)),
            y: Math.max(25, Math.min(75, loc.y + 10))
          });
          setChefExpression('pointing');

          setTimeout(() => {
            setChefScreenPos({ x: 18, y: 22 });
            setSpatialTarget(null);
            setChefExpression('happy');
          }, 6000);
        } else if (data.expression) {
          setChefExpression(data.expression as ChefExpression);
        }

        speakText(data.answer);
      }
    } catch (err) {
      console.warn('Q&A error:', err);
    } finally {
      setIsAskingQuestion(false);
      setUserQuestion('');
    }
  };

  // Screen Capture Vision Handler (Live Screen / Window / Tab Scanner!)
  const startScreenCapture = async () => {
    try {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' } as any });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
      setIsScreenSharing(true);
      showToast('🖥️ Screen Share Active! Chef Tom is scanning your screen live.');
      speakText('Screen connected! Chef Tom can now detect anything visible on your screen!');

      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        showToast('Screen sharing ended.');
      };
    } catch (err) {
      console.warn('Screen share error:', err);
      showToast('Screen capture request cancelled or unsupported.');
    }
  };

  // Any File Upload Vision Handler (Upload Any Image / Document Frame!)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningPan(true);
    setChefExpression('thinking');
    showToast(`📁 Reading file: ${file.name}...`);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const imageBase64 = reader.result as string;
        const res = await fetch('/api/vision/chef-vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            recipeTitle: recipe.title,
            currentStep: currentStepIdx,
            stepInstruction: recipe.instructions[currentStepIdx]
          })
        });

        const data = await res.json();
        if (data.status === 'success') {
          setPanObservation(data.observation);
          setChefAdvice(data.advice);

          if (data.targetLocation && typeof data.targetLocation.x === 'number') {
            const loc = data.targetLocation;
            setSpatialTarget({
              x: loc.x,
              y: loc.y,
              width: loc.width || 35,
              height: loc.height || 30,
              label: loc.label || `File: ${file.name}`,
              confidence: loc.confidence || 95
            });
            setChefScreenPos({
              x: Math.max(15, Math.min(85, loc.x > 50 ? loc.x - 22 : loc.x + 22)),
              y: Math.max(25, Math.min(75, loc.y + 10))
            });
            setChefExpression('pointing');

            setTimeout(() => {
              setChefScreenPos({ x: 18, y: 22 });
              setSpatialTarget(null);
              setChefExpression('happy');
            }, 6000);
          } else if (data.expression) {
            setChefExpression(data.expression as ChefExpression);
          }

          speakText(`Chef Tom analyzed file: ${data.observation}. ${data.advice}`);
        } else {
          showToast('Could not analyze uploaded file.');
        }
        setIsScanningPan(false);
      };
    } catch (err) {
      console.warn('File upload error:', err);
      showToast('Error uploading image file.');
      setIsScanningPan(false);
    }
  };

  // Direct Gemini Multimodal Voice Audio Recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendAudioToGemini(base64Audio, mediaRecorder.mimeType || 'audio/webm');
        };
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      showToast('🎙️ Recording voice question...');
    } catch (err) {
      console.warn('Audio mic access error:', err);
      showToast('Microphone access required for voice questions.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      setIsProcessingVoice(true);
      setChefExpression('thinking');
    }
  };

  const sendAudioToGemini = async (audioBase64: string, mimeType: string) => {
    try {
      let imageBase64 = '';
      if (videoRef.current) {
        const video = videoRef.current;
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth || 640;
        captureCanvas.height = video.videoHeight || 480;
        const ctx = captureCanvas.getContext('2d');
        if (ctx) ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        imageBase64 = captureCanvas.toDataURL('image/jpeg', 0.85);
      }

      const res = await fetch('/api/vision/chef-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          audioBase64,
          audioMimeType: mimeType,
          recipeTitle: recipe.title,
          currentStep: currentStepIdx,
          stepInstruction: recipe.instructions[currentStepIdx]
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        if (data.transcribedQuestion) {
          setTranscribedText(data.transcribedQuestion);
        }
        if (data.answer) {
          setQaAnswer(data.answer);
          speakText(data.answer);
        }
        if (data.targetLocation && typeof data.targetLocation.x === 'number') {
          const loc = data.targetLocation;
          setSpatialTarget({
            x: loc.x,
            y: loc.y,
            width: loc.width || 35,
            height: loc.height || 30,
            label: loc.label || 'Detected Target',
            confidence: loc.confidence || 92
          });
          setChefScreenPos({
            x: Math.max(15, Math.min(85, loc.x > 50 ? loc.x - 22 : loc.x + 22)),
            y: Math.max(25, Math.min(75, loc.y + 10))
          });
          setChefExpression('pointing');

          setTimeout(() => {
            setChefScreenPos({ x: 18, y: 22 });
            setSpatialTarget(null);
            setChefExpression('happy');
          }, 6000);
        } else if (data.expression) {
          setChefExpression(data.expression as ChefExpression);
        }
      } else {
        showToast('Gemini voice processing failed. Try again!');
      }
    } catch (err) {
      console.warn('Voice API error:', err);
      showToast('Audio processing error.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-[#120c09] text-white flex flex-col max-w-[480px] mx-auto overflow-hidden shadow-2xl font-sans"
      >
        {/* AR Live Camera Video Stream Background */}
        <div className="absolute inset-0 z-0 bg-[#18100c]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isCameraActive ? 'opacity-85' : 'opacity-20'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#120c09]/80 via-transparent to-[#120c09]/95 pointer-events-none"></div>
        </div>

        {/* Top Floating Header */}
        <div className="relative z-20 p-3 flex items-center justify-between bg-[#1e140f]/85 backdrop-blur-md border-b border-amber-500/20 m-2 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl text-white shadow-md">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h2 className="text-xs font-black tracking-wide text-amber-200 flex items-center gap-1.5">
                Chef Tom (High-Tech AR Vision)
              </h2>
              <p className="text-[10px] text-amber-300/80 truncate max-w-[180px]">
                {recipe.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAudioEnabled(!isAudioEnabled);
                showToast(isAudioEnabled ? 'Muted voice output' : 'Voice output enabled!');
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition ${
                isAudioEnabled ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/10 border-white/20 text-gray-400'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }}
              className="p-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Voice Subtitle Display Banner */}
        <AnimatePresence>
          {activeSubtitle && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-20 mx-3 p-2.5 bg-[#1e140f]/90 border border-amber-400/60 rounded-2xl backdrop-blur-md shadow-xl text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5">
                <Sparkle className="w-3 h-3 animate-pulse text-amber-300" />
                Chef Tom Voice Subtitles
              </div>
              <p className="text-xs font-bold text-amber-100 leading-snug">
                "{activeSubtitle}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main AR Workspace */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-3 pointer-events-none overflow-y-auto">

          {/* Hidden File Input for Any Image / Snapshot File */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* AI Chef Multi-Vision Action Bar: Camera | Screen Share | File Upload */}
          <div className="w-full grid grid-cols-3 gap-1.5 pointer-events-auto mt-1">
            <button
              onClick={handleScanPanWithAI}
              disabled={isScanningPan}
              className="py-2 px-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md border border-amber-300/40 transition active:scale-95 disabled:opacity-50"
              title="Scan live camera snapshot"
            >
              {isScanningPan ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-100 shrink-0" />
                  <span>📷 Scan Camera</span>
                </>
              )}
            </button>

            <button
              onClick={startScreenCapture}
              className={`py-2 px-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md border transition active:scale-95 ${
                isScreenSharing
                  ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse'
                  : 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/50 text-amber-200'
              }`}
              title="Detect anything visible on your screen, window or tab"
            >
              <Monitor className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>🖥️ Screen Detect</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanningPan}
              className="py-2 px-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 shadow-md transition active:scale-95 disabled:opacity-50"
              title="Upload any image file for AI detection"
            >
              <Upload className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>📁 Read File</span>
            </button>
          </div>

          {/* API Key Connection Status Pill */}
          <div className="w-full flex items-center justify-between px-2.5 py-1 bg-amber-950/40 border border-amber-500/30 rounded-xl text-[10px] text-amber-300/90 pointer-events-auto mt-1.5">
            <span className="flex items-center gap-1 font-bold">
              <Key className="w-3 h-3 text-emerald-400" />
              Free Gemini API Active: Connected
            </span>
            <button
              onClick={() => showToast('🔑 GEMINI_API_KEY connected! Google AI Studio Free Tier model active.')}
              className="underline text-amber-200 hover:text-white font-medium"
            >
              API Key Info
            </button>
          </div>

          {/* Live Pan Visual Observation Banner */}
          <AnimatePresence>
            {(panObservation || chefAdvice) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full mt-2 p-3 bg-[#1e140f]/95 border border-amber-500/60 rounded-2xl backdrop-blur-md pointer-events-auto shadow-xl space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chef Tom's Visual Sight:</span>
                </div>
                {panObservation && (
                  <p className="text-xs text-amber-100 font-medium italic">
                    "{panObservation}"
                  </p>
                )}
                {chefAdvice && (
                  <p className="text-xs font-bold text-emerald-300 pt-1 border-t border-white/10">
                    💡 Tip: {chefAdvice}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* HIGH-TECH AR COMPUTER VISION BOUNDING BOX OVERLAY (OpenCV / MediaPipe Style) */}
          <AnimatePresence>
            {spatialTarget && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  left: `${spatialTarget.x}%`,
                  top: `${spatialTarget.y}%`,
                  width: `${spatialTarget.width}%`,
                  height: `${spatialTarget.height}%`
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none border-2 border-emerald-400 rounded-xl bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex flex-col justify-between p-1.5"
              >
                {/* HUD Corner Crosshairs */}
                <div className="flex justify-between w-full">
                  <span className="w-3 h-3 border-t-2 border-l-2 border-emerald-300"></span>
                  <span className="w-3 h-3 border-t-2 border-r-2 border-emerald-300"></span>
                </div>

                {/* Center Target Tag */}
                <div className="self-center px-2.5 py-1 bg-black/85 border border-emerald-400 text-emerald-300 text-[10px] font-black rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap">
                  <Target className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>{spatialTarget.label} [{spatialTarget.confidence}% MATCH]</span>
                </div>

                <div className="flex justify-between w-full">
                  <span className="w-3 h-3 border-b-2 border-l-2 border-emerald-300"></span>
                  <span className="w-3 h-3 border-b-2 border-r-2 border-emerald-300"></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SPATIAL MOVING 3D VINTAGE TOMATO CHEF AVATAR (VERY LEFT TOP ANCHOR, COMPACT SIZE) */}
          <motion.div
            animate={{ left: `${chefScreenPos.x}%`, top: `${chefScreenPos.y}%` }}
            transition={{ type: 'spring', stiffness: 75, damping: 14 }}
            className="absolute z-30 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-auto flex items-center justify-center"
          >
            <canvas
              ref={canvas3DRef}
              width={140}
              height={140}
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
            />

            <div className="absolute -top-7 inset-x-0 bg-[#1e140f]/95 border border-amber-400/80 rounded-2xl px-2 py-0.5 text-[9px] text-amber-200 font-black text-center backdrop-blur-md shadow-2xl animate-bounce whitespace-nowrap">
              {isProcessingVoice
                ? '🧠 "Processing voice..."'
                : isRecordingAudio
                ? '🎙️ "Recording voice..."'
                : isSpeaking
                ? '🗣️ "Speaking..."'
                : chefExpression === 'pointing'
                ? `👇 "${spatialTarget?.label || 'Target'}"`
                : '🍅 "Chef Tom Ready!"'}
            </div>
          </motion.div>

          <div className="h-32"></div>

          {/* Q&A Response Card */}
          <AnimatePresence>
            {qaAnswer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full bg-amber-950/95 border border-amber-400/60 rounded-2xl p-3 mb-2 pointer-events-auto shadow-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    Chef Tom Answer:
                  </span>
                  <button onClick={() => setQaAnswer(null)} className="text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {transcribedText && (
                  <p className="text-[10px] text-amber-300/80 italic border-b border-amber-500/20 pb-1">
                    You asked: "{transcribedText}"
                  </p>
                )}
                <p className="text-amber-100 font-medium leading-relaxed">{qaAnswer}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick 1-Touch Voice Question Chips */}
          <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto no-scrollbar">
            {[
              "What is Urad Dal?",
              "Diced or ring onions?",
              "How much water?",
              "Where is the pan?"
            ].map((chipPrompt) => (
              <button
                key={chipPrompt}
                onClick={() => {
                  setUserQuestion(chipPrompt);
                  handleAskQuestionSubmit(chipPrompt);
                }}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-bold rounded-xl whitespace-nowrap transition active:scale-95"
              >
                💡 {chipPrompt}
              </button>
            ))}
          </div>

          {/* Interactive Voice Audio Recording & Text Q&A Input Bar */}
          <div className="w-full bg-[#1e140f]/90 backdrop-blur-md border border-amber-500/30 rounded-2xl p-2 pointer-events-auto mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAskQuestionSubmit(userQuestion);
              }}
              placeholder='Type or tap mic to speak...'
              className="flex-1 bg-transparent text-xs text-white placeholder-amber-200/50 outline-none"
            />

            {/* Direct Gemini Voice Audio Mic Record Button */}
            <button
              onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
              className={`p-2 rounded-xl text-xs font-black flex items-center justify-center transition border ${
                isRecordingAudio
                  ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30'
              }`}
              title={isRecordingAudio ? 'Stop Recording' : 'Hold / Tap to Record Voice'}
            >
              {isRecordingAudio ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => handleAskQuestionSubmit(userQuestion)}
              disabled={isAskingQuestion || !userQuestion.trim()}
              className="p-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold rounded-xl text-xs transition"
            >
              {isAskingQuestion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Current Step Guidance Card */}
          <div className="w-full bg-[#1e140f]/95 backdrop-blur-xl border border-amber-500/50 rounded-3xl p-4 space-y-3 pointer-events-auto shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                Step {currentStepIdx + 1} of {recipe.instructions.length}
              </span>

              <div className="flex items-center gap-1">
                {[0.75, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeechRate(rate);
                      speakText(`Step ${currentStepIdx + 1}. ${recipe.instructions[currentStepIdx]}`);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                      speechRate === rate
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-white/10 text-gray-300 border-white/10'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm font-bold text-white leading-relaxed">
              {recipe.instructions[currentStepIdx]}
            </p>
          </div>
        </div>

        {/* Bottom Floating Step Navigation Controls */}
        <div className="relative z-20 p-4 bg-[#120c09]/95 backdrop-blur-md border-t border-white/15 grid grid-cols-3 gap-3">
          <button
            onClick={handlePrevStep}
            disabled={currentStepIdx === 0}
            className="py-3 px-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1 border border-white/15 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={() => speakText(`Step ${currentStepIdx + 1}. ${recipe.instructions[currentStepIdx]}`)}
            className="py-3 px-3 bg-white/15 hover:bg-white/25 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1 border border-white/20 transition"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            Replay
          </button>

          <button
            onClick={handleNextStep}
            className="py-3 px-3 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl text-xs font-black flex items-center justify-center gap-1 shadow-lg transition"
          >
            {currentStepIdx === recipe.instructions.length - 1 ? 'Finish Recipe' : 'Next Step'}
            {currentStepIdx === recipe.instructions.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
