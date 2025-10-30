import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Activity, ArrowLeft, Download, User, Calendar, FileText, AlertCircle, Pill, HeartPulse, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SummaryView = () => {
  const { summaryId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [summaryId]);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API}/doctor/summary/${summaryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(response.data);
    } catch (error) {
      toast.error('Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(summary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `patient-summary-${summaryId}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Summary exported');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading summary...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Summary not found</p>
      </div>
    );
  }

  const summaryData = summary.summary_json || {};

  return (
    <div className="min-h-screen" data-testid="summary-view">
      {/* Navbar */}
      <nav className="glass px-6 py-4 border-b border-gray-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/doctor/dashboard')}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">MediMate</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-testid="export-btn"
            className="rounded-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Patient Summary</h1>
          <p className="text-gray-600">Comprehensive AI-generated consultation summary</p>
        </div>

        {/* Patient Info */}
        <Card className="glass mb-6" data-testid="patient-info-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-lg font-medium text-gray-900" data-testid="patient-name">
                  {summary.patient?.name || summaryData.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Age</p>
                <p className="text-lg font-medium text-gray-900" data-testid="patient-age">
                  {summaryData.age || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-lg font-medium text-gray-900">{summary.patient?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Region</p>
                <p className="text-lg font-medium text-gray-900">{summary.patient?.region || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Symptoms */}
        <Card className="glass mb-6" data-testid="symptoms-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Chief Complaints & Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {(summaryData.symptoms || []).length > 0 ? (
                    summaryData.symptoms.map((symptom, idx) => (
                      <Badge key={idx} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {symptom}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500">No symptoms recorded</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Duration</p>
                <p className="text-gray-900" data-testid="symptom-duration">{summaryData.duration || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card className="glass mb-6" data-testid="medical-history-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Medical History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Past Medical History</p>
              <p className="text-gray-900">{summaryData.medical_history || summaryData.history || 'None reported'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Family History
              </p>
              <p className="text-gray-900">{summaryData.family_history || 'None reported'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Medications & Allergies */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="glass" data-testid="medications-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-green-600" />
                Current Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">{summaryData.medications || 'None reported'}</p>
            </CardContent>
          </Card>
          <Card className="glass" data-testid="allergies-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">{summaryData.allergies || 'None reported'}</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Summary */}
        <Card className="glass mb-6" data-testid="ai-summary-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-purple-600" />
              AI-Generated Summary
            </CardTitle>
            <CardDescription>Comprehensive analysis from patient consultation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {summary.summary_text}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        {summary.images && summary.images.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Uploaded Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {summary.images.map((image, idx) => (
                  <img
                    key={idx}
                    src={`${BACKEND_URL}${image}`}
                    alt={`Symptom ${idx + 1}`}
                    className="rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SummaryView;
