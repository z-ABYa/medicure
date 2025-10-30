import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Activity, Send, Mic, MicOff, Upload, ArrowLeft, Loader2 } from 'lucide-react';
import { ReactMic } from 'react-mic';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatbotPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Start with welcome message
    setMessages([
      {
        sender: 'ai',
        message: 'Hello! I\'m your AI medical assistant. I\'ll help collect your medical information before your consultation. Let\'s start with your symptoms. What brings you here today?',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      sender: 'patient',
      message: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat/message`,
        { appointment_id: appointmentId, message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [...prev, response.data.ai_response]);

      // Check if summary generation prompt
      if (response.data.ai_response.message.toLowerCase().includes('generate a summary')) {
        setTimeout(async () => {
          await handleEndChat();
        }, 2000);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('appointment_id', appointmentId);

    setLoading(true);
    try {
      const response = await axios.post(`${API}/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Image uploaded and analyzed');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'patient',
          message: `[Image uploaded: ${file.name}]`,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'ai',
          message: response.data.analysis,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const onStop = async (recordedBlob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', recordedBlob.blob, 'audio.webm');
      formData.append('appointment_id', appointmentId);

      const response = await axios.post(`${API}/chat/voice`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'patient',
          message: response.data.transcribed_text,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'ai',
          message: response.data.ai_response,
          timestamp: new Date().toISOString()
        }
      ]);

      // Play TTS audio
      if (response.data.audio_url) {
        const audio = new Audio(`${BACKEND_URL}${response.data.audio_url}`);
        audio.play();
      }
    } catch (error) {
      toast.error('Failed to process voice input');
    } finally {
      setLoading(false);
    }
  };

  const handleEndChat = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${API}/chat/end?appointment_id=${appointmentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Consultation completed! Summary sent to doctor.');
      navigate('/patient/dashboard');
    } catch (error) {
      toast.error('Failed to end consultation');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="chatbot-page">
      {/* Navbar */}
      <nav className="glass px-6 py-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/patient/dashboard')}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">MediMate AI</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEndChat}
            data-testid="end-consultation-btn"
            disabled={loading}
            className="rounded-full"
          >
            End Consultation
          </Button>
        </div>
      </nav>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8" data-testid="chat-messages">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${idx}`}
            >
              <Card
                className={`max-w-[80%] p-4 ${
                  msg.sender === 'patient'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </Card>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start" data-testid="loading-indicator">
              <Card className="p-4 bg-white border border-gray-200">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="glass border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="hidden">
              <ReactMic
                record={isRecording}
                onStop={onStop}
                strokeColor="#2563eb"
                backgroundColor="#f3f4f6"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsRecording(!isRecording)}
              data-testid="voice-btn"
              disabled={loading}
              className={`rounded-full ${
                isRecording ? 'bg-red-100 text-red-600 border-red-200' : ''
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <label htmlFor="image-upload">
              <Button
                type="button"
                variant="outline"
                size="icon"
                data-testid="upload-image-btn"
                disabled={loading}
                className="rounded-full"
                asChild
              >
                <span>
                  <Upload className="w-5 h-5" />
                </span>
              </Button>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              data-testid="image-upload-input"
            />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              data-testid="message-input"
              disabled={loading || isRecording}
              className="flex-1 rounded-full"
            />
            <Button
              type="submit"
              data-testid="send-btn"
              disabled={loading || !input.trim() || isRecording}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
