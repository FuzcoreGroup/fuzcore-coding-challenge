import { useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { useCustomers, Customer } from '../../contexts/CustomerContext';
import { AddEditCustomerModal } from '../../components/AddEditCustomerModal';
import { DeleteConfirmationModal } from '../../components/DeleteConfirmationModal';
import { useToast } from '../../contexts/ToastContext';

export default function Customers() {
  const { customers, loading, deleteCustomer } = useCustomers();
  const { showToast } = useToast();
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsAddEditModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAddEditModalOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCustomer) {
      try {
        await deleteCustomer(selectedCustomer.id);
        showToast('Customer deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setSelectedCustomer(null);
      } catch (error) {
        console.error('Failed to delete customer:', error);
        showToast('Failed to delete customer', 'error');
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Customers">
      <div className="space-y-6">

         {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Total Customers</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">{customers.length}</p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Active</p>
            <p className="font-semibold text-[24px] text-[#16dbaa]">
              {customers.filter(c => c.status === 'Active').length}
            </p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Inactive</p>
            <p className="font-semibold text-[24px] text-[#718ebf]">
              {customers.filter(c => c.status === 'Inactive').length}
            </p>
          </div>
          <div className="bg-white rounded-[25px] p-6 shadow-sm">
            <p className="text-[14px] text-[#718ebf] mb-2">Total Balance</p>
            <p className="font-semibold text-[24px] text-[#343c6a]">
              ${customers.reduce((sum, c) => sum + c.balance, 0).toLocaleString()}
            </p>
          </div>
        </div>

        
        <div className="bg-white rounded-[25px] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-semibold text-[22px] text-[#343c6a]">Customer List</h2>

            <div className="flex gap-3">
              <div className="relative flex-1 sm:w-[300px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full h-[40px] pl-10 pr-4 rounded-[10px] border border-[#dfeaf2] bg-[#f5f7fa] text-[14px] text-[#343c6a] placeholder:text-[#8ba3cb] outline-none focus:border-[#2d60ff] transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <circle cx="7" cy="7" r="5" stroke="#718EBF" strokeWidth="1.5" />
                  <path d="M11 11L14 14" stroke="#718EBF" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

              <button
                onClick={handleAddCustomer}
                className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors whitespace-nowrap"
              >
                Add Customer
              </button>
            </div>
          </div>

          {loading && customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[60px] h-[60px] rounded-full border-4 border-[#e6eff5] border-t-[#2d60ff] animate-spin mb-4" />
              <p className="text-[#718ebf] text-[15px]">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-[80px] h-[80px] rounded-full bg-[#f5f7fa] flex items-center justify-center mb-4">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M20 23.3333C23.6819 23.3333 26.6667 20.3486 26.6667 16.6667C26.6667 12.9848 23.6819 10 20 10C16.3181 10 13.3333 12.9848 13.3333 16.6667C13.3333 20.3486 16.3181 23.3333 20 23.3333Z"
                    stroke="#718EBF"
                    strokeWidth="2"
                  />
                  <path
                    d="M8.33333 30C8.33333 26.3181 13.3955 23.3333 20 23.3333C26.6045 23.3333 31.6667 26.3181 31.6667 30"
                    stroke="#718EBF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-[18px] text-[#343c6a] mb-2">
                {searchQuery ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-[#718ebf] text-[14px] mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first customer'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleAddCustomer}
                  className="px-6 h-[40px] bg-[#1814f3] text-white font-medium text-[14px] rounded-[10px] hover:bg-[#2d60ff] transition-colors"
                >
                  Add Your First Customer
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#f3f3f5]">
                    <th className="text-left py-4 px-4 font-medium text-[14px] text-[#718ebf]">Name</th>
                    <th className="text-left py-4 px-4 font-medium text-[14px] text-[#718ebf]">Email</th>
                    <th className="text-left py-4 px-4 font-medium text-[14px] text-[#718ebf]">Phone</th>
                    <th className="text-left py-4 px-4 font-medium text-[14px] text-[#718ebf]">Status</th>
                    <th className="text-left py-4 px-4 font-medium text-[14px] text-[#718ebf]">Balance</th>
                    <th className="text-right py-4 px-4 font-medium text-[14px] text-[#718ebf]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-[#f3f3f5] last:border-0 hover:bg-[#f5f7fa] transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-[#2d60ff] to-[#1814f3] flex items-center justify-center text-white font-semibold text-[14px]">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[14px] text-[#343c6a]">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[14px] text-[#718ebf]">{customer.email}</td>
                      <td className="py-4 px-4 text-[14px] text-[#718ebf]">{customer.phone}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[12px] font-medium ${
                            customer.status === 'Active'
                              ? 'bg-[#dcfaf8] text-[#16dbcc]'
                              : 'bg-[#f3f3f5] text-[#718ebf]'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-medium text-[14px] text-[#343c6a]">
                        ${customer.balance.toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="w-[32px] h-[32px] rounded-[8px] bg-[#e7edff] hover:bg-[#2d60ff] text-[#2d60ff] hover:text-white transition-colors flex items-center justify-center group"
                            title="Edit customer"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M11.3333 2.00004C11.5084 1.82494 11.7163 1.68605 11.9451 1.59129C12.1739 1.49653 12.4191 1.44775 12.6666 1.44775C12.9142 1.44775 13.1594 1.49653 13.3882 1.59129C13.617 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.383 14.4088 2.61182C14.5035 2.84063 14.5523 3.08584 14.5523 3.33337C14.5523 3.5809 14.5035 3.82611 14.4088 4.05493C14.314 4.28374 14.1751 4.49161 14 4.66671L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00004Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(customer)}
                            className="w-[32px] h-[32px] rounded-[8px] bg-[#ffe0eb] hover:bg-[#fe5c73] text-[#fe5c73] hover:text-white transition-colors flex items-center justify-center group"
                            title="Delete customer"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M2 4H3.33333H14M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

       
      </div>

      <AddEditCustomerModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDeleteConfirm}
        customer={selectedCustomer}
        loading={loading}
      />
    </AppLayout>
  );
}
