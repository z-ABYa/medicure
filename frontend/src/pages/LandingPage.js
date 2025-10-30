import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, Stethoscope, MessageSquare, Shield, Clock, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2" data-testid="logo">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">MediMate</span>
          </div>
          <Button
            onClick={() => navigate('/auth')}
            data-testid="get-started-btn"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-full"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-6 text-sm font-medium">
            <Shield className="w-4 h-4" />
            AI-Powered Healthcare
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Smart Pre-Consultation
            <br />
            <span className="text-blue-600">Clinical History Collection</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Automate patient data collection before appointments. Save time, improve accuracy,
            and enhance doctor-patient consultations with AI-powered conversations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/auth')}
              data-testid="start-consultation-btn"
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-full text-lg"
            >
              Start Consultation
            </Button>
            <Button
              variant="outline"
              size="lg"
              data-testid="learn-more-btn"
              className="px-8 py-6 rounded-full text-lg border-2 border-blue-200 hover:border-blue-300"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose MediMate?</h2>
            <p className="text-lg text-gray-600">Revolutionizing healthcare with intelligent automation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl card-hover" data-testid="feature-ai-chat">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Chatbot</h3>
              <p className="text-gray-600">
                Intelligent conversation flow that asks relevant medical questions adaptively,
                ensuring comprehensive data collection.
              </p>
            </div>
            <div className="glass p-8 rounded-3xl card-hover" data-testid="feature-voice">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Voice Support</h3>
              <p className="text-gray-600">
                Speak naturally with voice input and output. Supports multiple languages
                for better accessibility.
              </p>
            </div>
            <div className="glass p-8 rounded-3xl card-hover" data-testid="feature-summary">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Stethoscope className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Summaries</h3>
              <p className="text-gray-600">
                AI-generated structured summaries provide doctors with clear,
                actionable patient information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple, efficient, and effective</p>
          </div>
          <div className="space-y-8">
            <div className="flex items-start gap-6 glass p-6 rounded-2xl" data-testid="step-1">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Book Appointment</h3>
                <p className="text-gray-600">
                  Patients select a doctor from their region and book an available time slot.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 glass p-6 rounded-2xl" data-testid="step-2">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chat with AI</h3>
                <p className="text-gray-600">
                  Engage in a natural conversation about symptoms, history, and health concerns.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-6 glass p-6 rounded-2xl" data-testid="step-3">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Doctor Reviews</h3>
                <p className="text-gray-600">
                  Doctors receive comprehensive AI-generated summaries before the appointment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of patients and doctors using MediMate for better healthcare.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            data-testid="cta-get-started-btn"
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 rounded-full text-lg"
          >
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-6 h-6" />
            <span className="text-lg font-bold">MediMate</span>
          </div>
          <p className="text-gray-400 mb-2">AI-Powered Pre-Consultation Platform</p>
          <p className="text-sm text-gray-500">© 2024 MediMate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
