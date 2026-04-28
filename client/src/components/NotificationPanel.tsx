import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return (
          <div className="w-[40px] h-[40px] rounded-full bg-[#e7edff] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="4" y="4" width="12" height="12" rx="2" stroke="#2d60ff" strokeWidth="1.5"/>
              <path d="M7 8H13M7 11H10" stroke="#2d60ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        );
      case 'customer':
        return (
          <div className="w-[40px] h-[40px] rounded-full bg-[#dcfaf8] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16 17V15C16 13.9391 15.5786 12.9217 14.8284 12.1716C14.0783 11.4214 13.0609 11 12 11H6C4.93913 11 3.92172 11.4214 3.17157 12.1716C2.42143 12.9217 2 13.9391 2 15V17" stroke="#16dbcc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 7C10.6569 7 12 5.65685 12 4C12 2.34315 10.6569 1 9 1C7.34315 1 6 2.34315 6 4C6 5.65685 7.34315 7 9 7Z" stroke="#16dbcc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'transaction':
        return (
          <div className="w-[40px] h-[40px] rounded-full bg-[#fff5d9] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14 3L17 6M17 6L14 9M17 6H6C4.89543 6 4 6.89543 4 8V9" stroke="#ffbb38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 17L3 14M3 14L6 11M3 14H14C15.1046 14 16 13.1046 16 12V11" stroke="#ffbb38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'category':
        return (
          <div className="w-[40px] h-[40px] rounded-full bg-[#ffe0eb] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="#fe5c73" strokeWidth="1.5"/>
              <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="#fe5c73" strokeWidth="1.5"/>
              <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="#fe5c73" strokeWidth="1.5"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="#fe5c73" strokeWidth="1.5"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-[40px] h-[40px] rounded-full bg-[#f5f7fa] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="#718ebf" strokeWidth="1.5"/>
              <path d="M10 6V10L13 13" stroke="#718ebf" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      ref={panelRef}
      className="absolute top-[70px] right-6 w-[380px] bg-white rounded-[20px] shadow-2xl border border-[#e6eff5] z-50 max-h-[500px] flex flex-col"
    >
      <div className="flex items-center justify-between p-5 border-b border-[#e6eff5]">
        <div>
          <h3 className="font-semibold text-[18px] text-[#343c6a]">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-[12px] text-[#718ebf] mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[12px] text-[#2d60ff] hover:underline font-medium"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[12px] text-[#fe5c73] hover:underline font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-[60px] h-[60px] rounded-full bg-[#f5f7fa] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M21 9.33333C21 7.47866 20.2625 5.70007 18.9497 4.3873C17.637 3.07452 15.8584 2.33333 14 2.33333C12.1416 2.33333 10.363 3.07452 9.05025 4.3873C7.73748 5.70007 7 7.47866 7 9.33333C7 17.5 3.5 19.8333 3.5 19.8333H24.5C24.5 19.8333 21 17.5 21 9.33333Z" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16.1166 24.5C15.9348 24.8525 15.6595 25.1479 15.3211 25.3544C14.9827 25.5609 14.5948 25.6709 14.1999 25.6709C13.8051 25.6709 13.4172 25.5609 13.0788 25.3544C12.7404 25.1479 12.4651 24.8525 12.2833 24.5" stroke="#718EBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[14px] text-[#718ebf]">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#f3f3f5]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-[#f5f7fa] transition-colors ${
                  !notification.read ? 'bg-[#f8f9ff]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-[14px] text-[#343c6a] truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-[#2d60ff] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[13px] text-[#718ebf] mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#8ba3cb]">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-[11px] text-[#2d60ff] hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => clearNotification(notification.id)}
                          className="text-[11px] text-[#fe5c73] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
