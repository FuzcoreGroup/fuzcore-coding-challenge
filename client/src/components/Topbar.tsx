import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationPanel } from './NotificationPanel';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-[100px] bg-white border-b border-[#e6eff5] flex items-center justify-between px-6 lg:px-10">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 flex items-center justify-center text-[#343c6a]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1 className="font-semibold text-[20px] lg:text-[28px] text-[#343c6a]">{title}</h1>
      </div>

      <div className="flex items-center gap-[15px] lg:gap-[30px]">
        {/* Search - hidden on mobile */}
        <div className="hidden md:flex items-center bg-[#f5f7fa] rounded-[40px] px-6 h-[50px] w-[255px]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-3">
            <circle cx="9" cy="9" r="7" stroke="#718EBF" strokeWidth="1.5" />
            <path d="M14 14L18 18" stroke="#718EBF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search for something"
            className="bg-transparent outline-none text-[15px] text-[#343c6a] placeholder:text-[#8ba3cb] w-full"
          />
        </div>

        {/* Settings */}
        <button className="w-[40px] lg:w-[50px] h-[40px] lg:h-[50px] rounded-full bg-[#f5f7fa] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z"
              stroke="#718EBF"
              strokeWidth="1.5"
            />
            <path
              d="M16.25 10C16.25 9.375 16.875 8.75 17.5 8.75C18.125 8.75 18.75 8.125 18.75 7.5V6.25C18.75 5.625 18.125 5 17.5 5C16.875 5 16.25 4.375 16.25 3.75"
              stroke="#718EBF"
              strokeWidth="1.5"
            />
          </svg>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-[40px] lg:w-[50px] h-[40px] lg:h-[50px] rounded-full bg-[#f5f7fa] flex items-center justify-center relative hover:bg-[#e6eff5] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 5V8.33333M10 17.5C8.61929 17.5 7.5 16.3807 7.5 15H12.5C12.5 16.3807 11.3807 17.5 10 17.5ZM15.8333 13.3333V9.16667C15.8333 6.4052 13.7615 4.16667 11.0417 4.16667H8.95833C6.23858 4.16667 4.16667 6.4052 4.16667 9.16667V13.3333L2.5 15H17.5L15.8333 13.3333Z"
                stroke={unreadCount > 0 ? '#FE5C73' : '#718EBF'}
                strokeWidth="1.5"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-[#fe5c73] rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-[40px] lg:w-[60px] h-[40px] lg:h-[60px] rounded-full bg-[#e6eff5] overflow-hidden hover:ring-2 hover:ring-[#2d60ff] transition-all"
          >
            <div className="w-full h-full bg-gradient-to-br from-[#2d60ff] to-[#1814f3] flex items-center justify-center text-white font-semibold text-[18px]">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-[15px] shadow-lg border border-[#e6eff5] py-2 z-50">
                <div className="px-4 py-3 border-b border-[#e6eff5]">
                  <p className="font-medium text-[14px] text-[#343c6a]">{user?.name}</p>
                  <p className="text-[12px] text-[#718ebf]">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-[14px] text-[#fe5c73] hover:bg-[#f5f7fa] transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
