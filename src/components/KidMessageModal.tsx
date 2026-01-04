import React, { useState } from 'react';
import { X, Pencil, Camera, MessageSquare, Loader2 } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { CameraCapture } from './CameraCapture';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { prepareImageForUpload } from '../utils/imageCompression';

interface KidMessageModalProps {
  onClose: () => void;
  onMessageSent: () => void;
}

type MessageMode = 'select' | 'draw' | 'camera' | 'text';

export function KidMessageModal({ onClose, onMessageSent }: KidMessageModalProps) {
  const [mode, setMode] = useState<MessageMode>('select');
  const [textMessage, setTextMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendKidPost = async (blob: Blob | null, type: 'drawing' | 'photo' | 'text', text?: string) => {
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('type', 'kid_post');
      formData.append('contentType', type);
      
      if (text) {
        formData.append('text', text);
      }

      if (blob && type !== 'text') {
        toast.info('Preparing your message...');
        const compressedImage = await prepareImageForUpload(
          new File([blob], 'kid-message.jpg', { type: blob.type })
        );
        formData.append('image', compressedImage);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf1072ab/kid-post`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent to Dad! 💕');
      onMessageSent();
      onClose();
    } catch (error) {
      console.error('Error sending kid post:', error);
      toast.error('Could not send message. Try again!');
    } finally {
      setIsSending(false);
    }
  };

  const handleDrawingSave = (blob: Blob) => {
    sendKidPost(blob, 'drawing');
  };

  const handlePhotoCapture = (blob: Blob) => {
    sendKidPost(blob, 'photo');
  };

  const handleTextSend = () => {
    if (!textMessage.trim()) {
      toast.error('Please write a message first!');
      return;
    }

    sendKidPost(null, 'text', textMessage);
  };

  if (isSending) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg text-slate-900">Sending to Dad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-yellow-500 text-white p-4 flex items-center justify-between shadow-lg">
        <h2 className="text-xl">Send Dad a Message! 💌</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-72px)]">
        {mode === 'select' && (
          <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
            <p className="text-xl text-center text-slate-700 mb-4">
              What do you want to send Dad?
            </p>
            
            <button
              onClick={() => setMode('draw')}
              className="w-full max-w-md bg-gradient-to-br from-purple-500 to-pink-500 text-white p-8 rounded-3xl shadow-2xl hover:scale-105 transition-transform"
            >
              <Pencil className="w-12 h-12 mx-auto mb-3" />
              <p className="text-2xl mb-2">Draw a Picture</p>
              <p className="text-sm opacity-90">Use your finger to draw!</p>
            </button>

            <button
              onClick={() => setMode('camera')}
              className="w-full max-w-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-8 rounded-3xl shadow-2xl hover:scale-105 transition-transform"
            >
              <Camera className="w-12 h-12 mx-auto mb-3" />
              <p className="text-2xl mb-2">Take a Photo</p>
              <p className="text-sm opacity-90">Show Dad what you're doing!</p>
            </button>

            <button
              onClick={() => setMode('text')}
              className="w-full max-w-md bg-gradient-to-br from-green-500 to-emerald-500 text-white p-8 rounded-3xl shadow-2xl hover:scale-105 transition-transform"
            >
              <MessageSquare className="w-12 h-12 mx-auto mb-3" />
              <p className="text-2xl mb-2">Write a Message</p>
              <p className="text-sm opacity-90">Type something to Dad!</p>
            </button>
          </div>
        )}

        {mode === 'draw' && (
          <DrawingCanvas
            onSave={handleDrawingSave}
            onCancel={() => setMode('select')}
          />
        )}

        {mode === 'camera' && (
          <CameraCapture
            onCapture={handlePhotoCapture}
            onCancel={() => setMode('select')}
          />
        )}

        {mode === 'text' && (
          <div className="flex flex-col h-full p-6 gap-4">
            <button
              onClick={() => setMode('select')}
              className="self-start text-slate-600 hover:text-slate-900 flex items-center gap-2"
            >
              ← Back
            </button>
            
            <div className="flex-1 flex flex-col gap-4">
              <label htmlFor="kidMessage" className="text-lg text-slate-700">
                Your message to Dad:
              </label>
              <Textarea
                id="kidMessage"
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                placeholder="Hi Dad! I miss you! 💕"
                className="flex-1 text-lg p-4"
                rows={10}
              />
            </div>

            <Button
              onClick={handleTextSend}
              disabled={!textMessage.trim()}
              className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
            >
              Send Message to Dad
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}