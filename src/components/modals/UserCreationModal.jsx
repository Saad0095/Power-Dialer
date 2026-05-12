import { useState } from 'react';
import { UserPlus, AlertCircle, X, Mail, Lock, User, Shield, CheckCircle2 } from 'lucide-react';
import { createUser } from '../../services/api';
import Modal from '../common/Modal';

const DEFAULT_SHIFT_START_TIME = '19:00';
const DEFAULT_SHIFT_END_TIME = '04:00';
const DEFAULT_TIMEZONE = 'Asia/Karachi';

export default function UserCreationModal({ isOpen, onClose, onSuccess, availableRoles, userRole }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState(DEFAULT_SHIFT_START_TIME);
  const [shiftEndTime, setShiftEndTime] = useState(DEFAULT_SHIFT_END_TIME);
  const [expectedWorkHours, setExpectedWorkHours] = useState('');
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('');
    setShiftStartTime(DEFAULT_SHIFT_START_TIME);
    setShiftEndTime(DEFAULT_SHIFT_END_TIME);
    setExpectedWorkHours('');
    setTimezone(DEFAULT_TIMEZONE);
    setError('');
    setSuccessMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!role) {
      setError('Please select a role');
      return;
    }

    if (!availableRoles.includes(role)) {
      setError('Invalid role selection');
      return;
    }

    try {
      setIsLoading(true);
      const result = await createUser(email, password, name, role, {
        shiftStartTime,
        shiftEndTime,
        timezone: timezone.trim() || DEFAULT_TIMEZONE,
        ...(expectedWorkHours ? { expectedWorkHours: Number(expectedWorkHours) } : {}),
      });
      const createdUser = result?.user || result;

      const successMsg = `${role.charAt(0).toUpperCase() + role.slice(1)} ${createdUser?.name || name} created successfully`;
      setSuccessMessage(successMsg);
      
      // Call parent's onSuccess callback
      onSuccess?.();
      
      // Clear form after successful creation
      setTimeout(() => {
        resetForm();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'caller-agent': 'Caller Agent',
      'closer-agent': 'Closer Agent',
      'scrapper': 'Scrapper',
      'client': 'Client',
    };
    return labels[role] || role;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New User" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
            User Role
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition appearance-none"
              disabled={isLoading}
            >
              <option value="">Select Role</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {getRoleLabel(r)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Shift Start
            </label>
            <input
              type="time"
              value={shiftStartTime}
              onChange={(e) => setShiftStartTime(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Shift End
            </label>
            <input
              type="time"
              value={shiftEndTime}
              onChange={(e) => setShiftEndTime(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Expected Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.25"
              value={expectedWorkHours}
              onChange={(e) => setExpectedWorkHours(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
              Timezone
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder={DEFAULT_TIMEZONE}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-slate-700 dark:text-slate-300 text-sm font-medium mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 focus:border-cyan-500 outline-none transition"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-emerald-400 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
