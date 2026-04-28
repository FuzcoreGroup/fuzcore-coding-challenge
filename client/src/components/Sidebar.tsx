import { useLocation, useNavigate } from 'react-router';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'home' },
    { name: 'Transactions', path: '/transactions', icon: 'transfer' },
    { name: 'Customers', path: '/customers', icon: 'user' },
    { name: 'Invoices', path: '/invoices', icon: 'creditcard' },
    { name: 'Categories', path: '/categories', icon: 'category' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const renderIcon = (iconName: string, isActive: boolean) => {
    const color = isActive ? '#2d60ff' : '#b1b1b1';

    switch (iconName) {
      case 'home':
        return (
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <path d="M3 9.5L12.5 2L22 9.5V20.5C22 21.0304 21.7893 21.5391 21.4142 21.9142C21.0391 22.2893 20.5304 22.5 20 22.5H5C4.46957 22.5 3.96086 22.2893 3.58579 21.9142C3.21071 21.5391 3 21.0304 3 20.5V9.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22.5V12.5H16V22.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'transfer':
        return (
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <path d="M17 3.5L21 7.5M21 7.5L17 11.5M21 7.5H7C5.93913 7.5 4.92172 7.92143 4.17157 8.67157C3.42143 9.42172 3 10.4391 3 11.5V12.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 21.5L3 17.5M3 17.5L7 13.5M3 17.5H17C18.0609 17.5 19.0783 17.0786 19.8284 16.3284C20.5786 15.5783 21 14.5609 21 13.5V12.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'user':
        return (
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <path d="M20 21.5V19.5C20 18.4391 19.5786 17.4217 18.8284 16.6716C18.0783 15.9214 17.0609 15.5 16 15.5H8C6.93913 15.5 5.92172 15.9214 5.17157 16.6716C4.42143 17.4217 4 18.4391 4 19.5V21.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11.5C14.2091 11.5 16 9.70914 16 7.5C16 5.29086 14.2091 3.5 12 3.5C9.79086 3.5 8 5.29086 8 7.5C8 9.70914 9.79086 11.5 12 11.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'creditcard':
        return (
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <rect x="2" y="5.5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 10.5H22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 15.5H10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'category':
        return (
          <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
            <rect x="3" y="3.5" width="8" height="8" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="3.5" width="8" height="8" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="14.5" width="8" height="8" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="14.5" width="8" height="8" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[250px] bg-white border-r border-[#e6eff5] z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-[100px] flex items-center px-[38px] border-b border-[#e6eff5]">
          <div className="flex items-center gap-3">
            <div className="w-[36px] h-[36px] bg-[#2d60ff] rounded-full" />
            <span className="font-bold text-[25px] text-[#343c6a]">BankDash.</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="pt-[30px]">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
              className={`w-full flex items-center gap-[26px] px-[44px] py-[18px] relative transition-colors ${
                isActive(item.path)
                  ? 'text-[#2d60ff]'
                  : 'text-[#b1b1b1] hover:text-[#343c6a]'
              }`}
            >
              {isActive(item.path) && (
                <div className="absolute left-0 top-0 h-full w-[6px] bg-[#2d60ff] rounded-r-[10px]" />
              )}
              {renderIcon(item.icon, isActive(item.path))}
              <span className="font-medium text-[18px]">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
