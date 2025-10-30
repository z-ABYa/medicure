import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Activity, LogOut, Search, Calendar, FileText, User } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/doctor/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) =>
    apt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" data-testid="doctor-dashboard">
      {/* Navbar */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">MediMate</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Dr. {user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              data-testid="logout-btn"
              className="rounded-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">{user?.specialization} • {user?.region}</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
                  <p className="text-3xl font-bold text-gray-900">{appointments.length}</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {appointments.filter((a) => a.summary).length}
                  </p>
                </div>
                <FileText className="w-12 h-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Patients</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {appointments.filter((a) => a.status === 'booked').length}
                  </p>
                </div>
                <User className="w-12 h-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-input"
              className="pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Appointments List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Appointments</h2>
          {loading ? (
            <p className="text-gray-600">Loading appointments...</p>
          ) : filteredAppointments.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((apt) => (
                <Card
                  key={apt.appointment_id}
                  className="glass card-hover"
                  data-testid={`appointment-${apt.appointment_id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900" data-testid={`patient-name-${apt.appointment_id}`}>
                            {apt.patient?.name || 'Unknown Patient'}
                          </h3>
                          <Badge
                            variant={apt.status === 'completed' ? 'default' : 'secondary'}
                            data-testid={`appointment-status-${apt.appointment_id}`}
                          >
                            {apt.status}
                          </Badge>
                          {apt.summary && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Summary Available
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{apt.slot}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{apt.patient?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {apt.summary && (
                          <Button
                            onClick={() => navigate(`/doctor/summary/${apt.summary.summary_id}`)}
                            data-testid={`view-summary-btn-${apt.appointment_id}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Summary
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
