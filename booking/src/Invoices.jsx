import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';

export default function Invoices() {
  const { socket, user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ booking: '', amount: '', reportMonth: '' });
  const [notification, setNotification] = useState(null);
  const [bookings, setBookings] = useState([]);

  // Fetch invoices and bookings only after user is authenticated
  useEffect(() => {
    if (authLoading || !user) return;
    
    setLoading(true);
    Promise.all([
      api.get('/invoices'),
      api.get('/bookings')
    ]).then(([invRes, bookRes]) => {
      setInvoices(invRes.data);
      setBookings(bookRes.data);
    }).catch(err => {
      console.error('Failed to fetch data:', err);
      setNotification('Failed to load data');
    }).finally(() => setLoading(false));
  }, [user, authLoading]);

  // Live updates
  useEffect(() => {
    if (!socket) return;
    const handleNew = (invoice) => {
      setInvoices(prev => [invoice, ...prev.filter(i => i._id !== invoice._id)]);
      setNotification('New invoice submitted!');
    };
    const handleUpdate = (invoice) => {
      setInvoices(prev => prev.map(i => i._id === invoice._id ? invoice : i));
      setNotification('Invoice updated');
    };
    const handleDelete = ({ id }) => {
      setInvoices(prev => prev.filter(i => i._id !== id));
      setNotification('Invoice deleted');
    };
    socket.on('invoice:new', handleNew);
    socket.on('invoice:update', handleUpdate);
    socket.on('invoice:delete', handleDelete);
    return () => {
      socket.off('invoice:new', handleNew);
      socket.off('invoice:update', handleUpdate);
      socket.off('invoice:delete', handleDelete);
    };
  }, [socket]);

  // Dismiss notification
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 2500);
    return () => clearTimeout(t);
  }, [notification]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post('/invoices', form);
    setForm({ booking: '', amount: '', reportMonth: '' });
  }

  return (
    <div>
      <h2>Invoices</h2>
      {notification && <div className="notification">{notification}</div>}
      <form className="invoice-form" onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <select name="booking" value={form.booking} onChange={handleChange} required>
          <option value="">Select Booking</option>
          {bookings.map(b => <option key={b._id} value={b._id}>{b.bookingId} - {b.company}</option>)}
        </select>
        <input name="amount" type="number" placeholder="Amount" value={form.amount} onChange={handleChange} required />
        <input name="reportMonth" placeholder="Report Month (YYYY-MM)" value={form.reportMonth} onChange={handleChange} required />
        <button type="submit">Submit Invoice</button>
      </form>
      {loading ? <p>Loading...</p> : (
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Paid</th>
              <th>Report Month</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv._id}>
                <td>{inv.booking?.bookingId || '-'}</td>
                <td>{inv.amount}</td>
                <td>{inv.status}</td>
                <td>{inv.submittedAt && new Date(inv.submittedAt).toLocaleString()}</td>
                <td>{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : '-'}</td>
                <td>{inv.reportMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
