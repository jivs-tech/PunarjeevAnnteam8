'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, Image as ImageIcon, ArrowRight, ArrowLeft, AlertTriangle, Sparkles, RefreshCw, CheckCircle2, Zap, Play } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { compressImageFile } from '@/lib/imageCompressor';
import { PhotoAsset, IngredientItem, PantryItem } from '@/types';
import { calculateLogicalExpiryDate } from '@/lib/pantryExpiryHelper';
import Image from 'next/image';
import { Show, SignInButton, UserButton } from '@clerk/nextjs';

const emptySubscribe = () => () => {};
const useHasMounted = () =>
  React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

interface FloatingDetectedTag {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
  xPercent: number;
  yPercent: number;
}

export const CameraScanView: React.FC = () => {
  const { 
    setStep, 
    scanContext,
    addPhoto, 
    addIngredients, 
    addPantryItems,
    ingredients, 
    pantryItems,
    photos, 
    showToast 
  } = useAppStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasMounted = useHasMounted();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLiveScanning, setIsLiveScanning] = useState(true);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const [detectedLiveTags, setDetectedLiveTags] = useState<FloatingDetectedTag[]>([]);
  const [shutterFlash, setShutterFlash] = useState(false);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      setStreamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Live camera stream unavailable:', err);
      setStreamError('Camera permission blocked or unavailable. Tap "Open Live Camera Scanner" below or upload device photos.');
      setIsCameraActive(false);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  // Frame Capture Helper (Using JPEG for 100% Safari iOS & Android compatibility)
  const captureFrameBase64 = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video.videoWidth || !video.videoHeight) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  // Live Auto Scan Loop
  const performLiveAnalysis = useCallback(async () => {
    if (!isCameraActive || isAnalyzingFrame) return;

    const base64Image = captureFrameBase64();
    if (!base64Image) return;

    setIsAnalyzingFrame(true);

    try {
      const res = await fetch('/api/vision/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [{ base64Data: base64Image, mimeType: 'image/jpeg' }]
        })
      });

      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.detectedIngredients) && data.detectedIngredients.length > 0) {
        const newDetectedItems: IngredientItem[] = data.detectedIngredients;

        const floatingTags: FloatingDetectedTag[] = newDetectedItems.map((item, idx) => ({
          id: item.id || `tag_${idx}_${Date.now()}`,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          confidence: Math.round((item.confidenceScore || 0.92) * 100),
          xPercent: 20 + ((idx * 30) % 60),
          yPercent: 30 + ((idx * 25) % 45)
        }));

        setDetectedLiveTags(floatingTags);
      }
    } catch (err) {
      console.warn('Live AI scan frame skip:', err);
    } finally {
      setIsAnalyzingFrame(false);
    }
  }, [isCameraActive, isAnalyzingFrame, captureFrameBase64, ingredients, pantryItems, scanContext, addIngredients, addPantryItems, showToast]);

  // Shutter Snap Capture
  const handleCapturePhoto = async () => {
    if (photos.length >= 5) {
      showToast('Maximum limit of 5 photos reached per session.');
      setStep('photo_review');
      return;
    }

    const base64Data = captureFrameBase64();
    if (!base64Data) {
      showToast('Failed to capture photo frame. Try opening camera.');
      return;
    }

    // Trigger visual camera shutter flash animation
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);
    setIsProcessing(true);

    try {
      const photo: PhotoAsset = {
        id: 'photo_' + Math.random().toString(36).substring(2, 9),
        blobUrl: base64Data,
        base64Data,
        fileName: `fridge_capture_${photos.length + 1}.jpg`,
        timestamp: Date.now()
      };

      const added = addPhoto(photo);
      if (added) {
        showToast(`📸 Photo #${photos.length + 1} captured! You can snap more or review.`);
      }
    } catch {
      showToast('Failed to capture photo. Try gallery upload.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 5) {
      showToast('Maximum limit of 5 photos reached per session.');
    }

    setIsProcessing(true);
    const availableSlots = 5 - photos.length;
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    for (const file of filesToProcess) {
      try {
        const { base64Data, blobUrl } = await compressImageFile(file);
        const photoAsset: PhotoAsset = {
          id: 'photo_' + Math.random().toString(36).substring(2, 9),
          blobUrl,
          base64Data,
          fileName: file.name,
          timestamp: Date.now()
        };
        addPhoto(photoAsset);
      } catch {
        showToast(`Failed to process ${file.name}`);
      }
    }

    setIsProcessing(false);
    setStep('photo_review');
  };

  return (
    <div className="flex flex-col min-h-screen text-[#2a201b] pb-28 relative z-10">
      {/* Sleek Compact Header Bar with Navigation & Clerk User Button */}
      <div className="flex items-center justify-between py-2 border-b border-[#c8b49e]/60 mb-3 bg-[#fffdf7]/30 backdrop-blur-md px-3 rounded-2xl border mt-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep('landing')}
            className="p-1.5 bg-[#fffdf7]/40 hover:bg-[#fffdf7]/60 text-[#3a2a1d] border border-[#b8a48e] rounded-xl transition flex items-center justify-center shadow-sm"
            title="Back to Landing Page"
          >
            <ArrowLeft className="w-4 h-4 text-[#3a2a1d]" />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 relative shrink-0">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <h1 className="text-xs font-black text-[#2a201b] tracking-wide">
              PunarJeevAnn
            </h1>
          </div>
        </div>

        {/* Clean User Profile Button */}
        <div className="flex items-center gap-2">
          {hasMounted && (
            <>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="px-2.5 py-1 bg-[#3a2a1d] hover:bg-[#5a4636] text-[#fcfaf5] rounded-xl text-[11px] font-bold transition shadow-sm">
                    Sign In
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </>
          )}
        </div>
      </div>

      {/* FIXED CLEAN SUB-TAB NAVIGATION SWITCHER: Add Manually | Scan Items (Camera) */}
      <div className="grid grid-cols-2 p-1 bg-[#efe8da]/30 border border-[#b8a48e]/70 rounded-2xl mb-3 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setStep(scanContext === 'pantry' ? 'pantry' : 'manual_input')}
          className="py-2 text-xs font-bold rounded-xl transition text-center text-[#6b5b50] hover:text-[#2a201b]"
        >
          Add Manually
        </button>
        <button
          type="button"
          className="py-2 text-xs font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5 bg-[#3a2a1d] text-[#fcfaf5] shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          Scan Items (Camera)
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewfinder or Action Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
        {isCameraActive ? (
          <div className="relative w-full max-w-sm aspect-[3/4] bg-[#1a1410] rounded-3xl overflow-hidden border-2 border-[#b8a48e] shadow-2xl group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* VISUAL CAMERA SHUTTER FLASH EFFECT */}
            {shutterFlash && (
              <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-200 pointer-events-none"></div>
            )}

            {/* GOOGLE LENS VIEW-FINDER OVERLAY BORDER BRACKETS */}
            <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-2xl flex flex-col justify-between p-3">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg"></div>
                <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg"></div>
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg"></div>
                <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg"></div>
              </div>
            </div>

            {/* CAPTURED PHOTOS PREVIEW THUMBNAIL STRIP */}
            {photos.length > 0 && (
              <div className="absolute top-14 right-4 z-30 flex flex-col items-end gap-1.5 pointer-events-auto">
                <div 
                  onClick={() => setStep('photo_review')}
                  className="flex items-center gap-1 bg-[#1a1410]/85 backdrop-blur-md px-2 py-1 rounded-xl border border-[#b8a48e]/70 text-[10px] text-white font-bold cursor-pointer hover:scale-105 transition shadow-lg"
                >
                  <span>{photos.length} Captured</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="flex gap-1">
                  {photos.slice(-3).map((p, i) => (
                    <div 
                      key={p.id} 
                      onClick={() => setStep('photo_review')}
                      className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-md relative cursor-pointer group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.blobUrl} alt={`Snap ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANIMATED GOOGLE LENS LASER SCANNING LINE */}
            {isLiveScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-[bounce_2s_infinite] pointer-events-none top-1/4"></div>
            )}

            {/* FLOATING REAL-TIME GOOGLE LENS DETECTED INGREDIENT TAGS */}
            {detectedLiveTags.map((tag) => (
              <div
                key={tag.id}
                style={{ top: `${tag.yPercent}%`, left: `${tag.xPercent}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500 ease-out scale-95 hover:scale-105"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1410]/85 backdrop-blur-md text-white border border-emerald-400/80 rounded-full shadow-lg text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{tag.name}</span>
                  <span className="text-[10px] text-emerald-300 font-normal">({tag.quantity} {tag.unit})</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
                </div>
              </div>
            ))}

            {/* Live AI Status Pill */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#1a1410]/80 backdrop-blur-md border border-[#b8a48e]/60 px-3 py-1 rounded-full text-xs font-bold text-[#fcfaf5]">
                {isAnalyzingFrame ? (
                  <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 text-amber-400" />
                )}
                <span>{isAnalyzingFrame ? 'AI Scanning...' : 'Live Stream'}</span>
              </div>
            </div>

            {/* Live Toggle Pill */}
            <button
              type="button"
              onClick={() => setIsLiveScanning(!isLiveScanning)}
              className={`absolute top-4 right-4 z-30 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border transition shadow-lg ${
                isLiveScanning
                  ? 'bg-emerald-600/90 text-white border-emerald-500 animate-pulse'
                  : 'bg-[#1a1410]/80 text-[#d8cca8] border-[#b8a48e]/50'
              }`}
            >
              <Zap className="w-3 h-3" />
              {isLiveScanning ? 'Auto Lens: ON' : 'Auto Lens: OFF'}
            </button>

            {/* Live Ingredients Detected Banner */}
            {(scanContext === 'pantry' ? pantryItems.length > 0 : ingredients.length > 0) && (
              <div className="absolute bottom-4 inset-x-4 z-20 bg-[#1a1410]/90 backdrop-blur-md border border-emerald-500/40 rounded-2xl p-2.5 flex items-center justify-between text-xs text-white shadow-xl">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-emerald-300 text-[11px]">
                      {scanContext === 'pantry' ? pantryItems.length : ingredients.length} Item{(scanContext === 'pantry' ? pantryItems.length : ingredients.length) > 1 ? 's' : ''} Added to {scanContext === 'pantry' ? 'Pantry' : 'List'}
                    </p>
                    <p className="text-[10px] text-gray-300 truncate">
                      {(scanContext === 'pantry' ? pantryItems : ingredients).map((i) => i.name).join(', ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(scanContext === 'pantry' ? 'pantry' : 'editable_list')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl shrink-0 transition shadow-md"
                >
                  View ({scanContext === 'pantry' ? pantryItems.length : ingredients.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Prominent Action Panel when Live Camera is initializing or awaiting tap */
          <div className="w-full max-w-sm p-6 bg-[#fffdf7]/40 backdrop-blur-md border-[1.5px] border-[#b8a48e] rounded-3xl text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#3a2a1d]/10 border border-[#3a2a1d]/20 flex items-center justify-center text-[#3a2a1d]">
              <Camera className="w-8 h-8" />
            </div>

            {streamError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[#9a6520] text-xs flex items-start gap-2 text-left font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{streamError}</span>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#2a201b]">Camera & AI Vision Scanner</h2>
              <p className="text-xs text-[#6b5b50]">
                Choose how you want to add ingredients from your fridge:
              </p>
            </div>

            {/* ACTION BUTTON 1: START LIVE CAMERA SCANNER */}
            <button
              onClick={startCamera}
              className="w-full py-3.5 px-4 bg-[#3a2a1d] hover:bg-[#5a4636] active:scale-[0.98] text-[#fcfaf5] font-bold rounded-2xl shadow-lg border border-[#5a4636] text-xs flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              Open Live Camera Scanner
            </button>

            {/* ACTION BUTTON 2: UPLOAD PHOTOS FROM DEVICE */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 bg-[#fffdf7]/60 hover:bg-[#fffdf7] active:scale-[0.98] text-[#3a2a1d] font-bold rounded-2xl shadow-sm border border-[#b8a48e] text-xs flex items-center justify-center gap-2 transition"
            >
              <ImageIcon className="w-4 h-4 text-[#3a2a1d]" />
              Upload Photos from Device
            </button>
          </div>
        )}
      </div>

      {/* Control Bar when Camera is Active */}
      {isCameraActive && (
        <div className="p-4 bg-[#fffdf7]/40 backdrop-blur-md border-t border-[#b8a48e] flex items-center justify-around rounded-t-3xl shadow-lg mt-2">
          {/* Device Gallery Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-[#3a2a1d] hover:text-[#2a201b] text-[11px] font-bold"
          >
            <div className="p-3 bg-[#fffdf7] rounded-full border border-[#b8a48e] shadow-sm hover:scale-105 transition">
              <ImageIcon className="w-5 h-5 text-[#3a2a1d]" />
            </div>
            Gallery
          </button>

          {/* Shutter Snap Capture Button */}
          <button
            onClick={handleCapturePhoto}
            disabled={isProcessing || photos.length >= 5}
            className="w-16 h-16 rounded-full bg-[#3a2a1d] hover:bg-[#5a4636] active:scale-95 text-[#fcfaf5] flex items-center justify-center shadow-2xl border-4 border-[#fffdf7] disabled:opacity-50 transition relative group"
            title="Snap Photo Frame"
          >
            <div className="w-10 h-10 rounded-full border-2 border-[#fffdf7]/60 flex items-center justify-center group-hover:scale-90 transition">
              <div className="w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
          </button>

          {/* Done / Review Button */}
          <button
            onClick={() => {
              if (photos.length > 0) {
                setStep('photo_review');
              } else if (scanContext === 'pantry') {
                setStep('pantry');
              } else if (ingredients.length > 0) {
                setStep('editable_list');
              } else {
                handleCapturePhoto();
              }
            }}
            className="flex flex-col items-center gap-1 text-[#3a2a1d] hover:text-[#2a201b] text-[11px] font-bold"
          >
            <div className="p-3 bg-[#fffdf7] rounded-full border border-[#b8a48e] shadow-sm hover:scale-105 transition">
              <ArrowRight className="w-5 h-5 text-[#3a2a1d]" />
            </div>
            {photos.length > 0 ? `Review (${photos.length})` : 'Snap'}
          </button>
        </div>
      )}
    </div>
  );
};


