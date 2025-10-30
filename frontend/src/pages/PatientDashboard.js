import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Activity, Calendar, LogOut, Stethoscope, Star, Clock, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [slot, setSlot] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API}/patient/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/patient/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      toast.error('Failed to load appointments');
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API}/patient/book`,
        { doctor_id: bookingDoctor.user_id, slot },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Appointment booked successfully!');
      setBookingDoctor(null);
      setSlot('');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to book appointment');
    }
  };

  return (
    <div className="min-h-screen" data-testid="patient-dashboard">
      {/* Navbar */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">MediMate</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
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
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Patient Dashboard</h1>
          <p className="text-gray-600">Manage your appointments and consultations</p>
        </div>

        {/* My Appointments */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
          {appointments.length === 0 ? (
            <Card className="glass" data-testid="no-appointments">
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments yet. Book one below!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {appointments.map((apt) => (
                <Card key={apt.appointment_id} className="glass card-hover" data-testid={`appointment-${apt.appointment_id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">{apt.slot}</span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          apt.status === 'booked'
                            ? 'bg-green-100 text-green-700'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        data-testid={`appointment-status-${apt.appointment_id}`}
                      >
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Appointment ID: {apt.appointment_id.slice(0, 8)}</p>
                    {apt.status === 'booked' && (
                      <Button
                        onClick={() => navigate(`/patient/chat/${apt.appointment_id}`)}
                        data-testid={`start-chat-btn-${apt.appointment_id}`}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Start Consultation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Available Doctors */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Doctors in {user?.region}</h2>
          {loading ? (
            <p className="text-gray-600">Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <Card className="glass">
              <CardContent className="py-12 text-center">
                <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No doctors available in your region</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Card key={doctor.user_id} className="glass card-hover" data-testid={`doctor-${doctor.user_id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{doctor.name}</CardTitle>
                        <CardDescription className="mt-1">{doctor.specialization}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{doctor.rating || 4.5}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setBookingDoctor(doctor)}
                          data-testid={`book-appointment-btn-${doctor.user_id}`}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Appointment
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="booking-dialog">
                        <DialogHeader>
                          <DialogTitle>Book Appointment with {bookingDoctor?.name}</DialogTitle>
                          <DialogDescription>
                            Select a time slot for your consultation
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleBookAppointment} className="space-y-4">
                          <div>
                            <Label htmlFor="slot">Select Date & Time</Label>
                            <Input
                              id="slot"
                              data-testid="slot-input"
                              type="datetime-local"
                              value={slot}
                              onChange={(e) => setSlot(e.target.value)}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            data-testid="confirm-booking-btn"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                          >
                            Confirm Booking
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
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

export default PatientDashboard;
