import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const { signup, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      await signup(email, password, name);
      showToast('Account created successfully! Welcome aboard!', 'success');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setErrors({ general: errorMessage });
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1814f3] to-[#2d60ff] flex items-center justify-center p-6">
      <div className="w-full max-w-[450px] bg-white rounded-[25px] p-8 lg:p-12 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-[40px] h-[40px] bg-[#2d60ff] rounded-full" />
            <span className="font-bold text-[28px] text-[#343c6a]">BankDash.</span>
          </div>
          <p className="text-[#718ebf] text-[15px]">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.name ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Enter your full name"
              disabled={loading}
              autoComplete="name"
            />
            {errors.name && (
              <p className="mt-1 text-[#fe5c73] text-[12px]">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.email ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Enter your email"
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1 text-[#fe5c73] text-[12px]">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
                if (confirmPassword && e.target.value !== confirmPassword) {
                  setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
                } else if (confirmPassword && e.target.value === confirmPassword) {
                  setErrors({ ...errors, confirmPassword: undefined });
                }
              }}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.password ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Create a password (min 6 characters)"
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="mt-1 text-[#fe5c73] text-[12px]">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (e.target.value !== password) {
                  setErrors({ ...errors, confirmPassword: 'Passwords do not match' });
                } else {
                  setErrors({ ...errors, confirmPassword: undefined });
                }
              }}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                errors.confirmPassword ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Confirm your password"
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-[#fe5c73] text-[12px]">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.general && (
            <div className="bg-[#ffe0eb] border border-[#fe5c73] rounded-[15px] p-4 text-[#fe5c73] text-[14px]">
              {errors.general}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#1814f3] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#2d60ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[#718ebf] text-[14px]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2d60ff] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}