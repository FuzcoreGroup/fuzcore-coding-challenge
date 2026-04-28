import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, name);
      showToast('Account created successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      showToast(err instanceof Error ? err.message : 'Failed to sign up', 'error');
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
              onChange={(e) => setName(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                error && !name ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                error && !email ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                error && !password ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Create a password"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block font-medium text-[14px] text-[#343c6a] mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full h-[50px] px-4 rounded-[15px] border ${
                error && !confirmPassword ? 'border-[#fe5c73]' : 'border-[#dfeaf2]'
              } bg-[#f5f7fa] text-[#343c6a] text-[15px] outline-none focus:border-[#2d60ff] transition-colors`}
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-[#ffe0eb] border border-[#fe5c73] rounded-[15px] p-4 text-[#fe5c73] text-[14px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[50px] bg-[#1814f3] text-white font-medium text-[16px] rounded-[15px] hover:bg-[#2d60ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
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
