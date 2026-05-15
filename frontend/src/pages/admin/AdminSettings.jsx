import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLayout } from './AdminDashboard';
import { changePassword, getAdminFlashSale, updateFlashSale } from '../../api';

function toLocalDatetime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function AdminSettings() {
  const { admin } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Flash sale state
  const [flashSale, setFlashSale] = useState(null);
  const [flashLoading, setFlashLoading] = useState(true);
  const [flashSaving, setFlashSaving] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState('');
  const [flashError, setFlashError] = useState('');
  const [flashForm, setFlashForm] = useState({ active: false, end_date: '', bannerFile: null, clearBanner: false });
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    getAdminFlashSale()
      .then(res => {
        const d = res.data;
        setFlashSale(d);
        setFlashForm({ active: d.active || false, end_date: toLocalDatetime(d.end_date), bannerFile: null, clearBanner: false });
      })
      .catch(() => {})
      .finally(() => setFlashLoading(false));
  }, []);

  const handleSaveFlashSale = async () => {
    setFlashSaving(true);
    setFlashError('');
    setFlashSuccess('');
    try {
      const fd = new FormData();
      fd.append('active', flashForm.active);
      fd.append('end_date', flashForm.end_date || '');
      if (flashForm.bannerFile) fd.append('bannerImage', flashForm.bannerFile);
      if (flashForm.clearBanner) fd.append('clearBanner', 'true');
      const res = await updateFlashSale(fd);
      setFlashSale(res.data);
      setFlashForm(prev => ({ ...prev, active: res.data.active ?? prev.active, end_date: toLocalDatetime(res.data.end_date), bannerFile: null, clearBanner: false }));
      setBannerPreview(null);
      setFlashSuccess('Flash sale settings saved');
    } catch (err) {
      setFlashError(err.response?.data?.error || 'Failed to save flash sale settings');
    } finally {
      setFlashSaving(false);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your admin account</p>
        </div>

        <div className="max-w-lg space-y-6 pb-8">
          {/* Account info */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Account Info</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-burgundy-100 flex items-center justify-center flex-shrink-0">
                <span className="text-burgundy-700 font-bold text-sm">
                  {admin?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{admin?.email}</p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 mb-5">Change Password</h2>

            {success && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-burgundy-500 focus:ring-1 focus:ring-burgundy-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-burgundy-500 focus:ring-1 focus:ring-burgundy-500"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-burgundy-500 focus:ring-1 focus:ring-burgundy-500"
                  placeholder="Repeat new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-burgundy-500 hover:bg-burgundy-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Updating...
                  </>
                ) : 'Update Password'}
              </button>
            </form>
          </div>
          {/* Flash Sale */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-800">Flash Sale Banner</h2>
                <p className="text-xs text-gray-400 mt-0.5">Controls the homepage countdown banner</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: flashForm.active ? '#d1fae5' : '#f3f4f6', color: flashForm.active ? '#065f46' : '#6b7280' }}>
                {flashForm.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {flashSuccess && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {flashSuccess}
              </div>
            )}
            {flashError && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {flashError}
              </div>
            )}

            {flashLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : (
              <div className="space-y-5">
                {/* Enable toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Enable Flash Sale</p>
                    <p className="text-xs text-gray-400 mt-0.5">Shows banner on the homepage</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlashForm(prev => ({ ...prev, active: !prev.active }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${flashForm.active ? 'bg-burgundy-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${flashForm.active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Sale end date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sale End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={flashForm.end_date}
                    onChange={e => setFlashForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-burgundy-500 focus:ring-1 focus:ring-burgundy-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Banner hides automatically when this time passes</p>
                </div>

                {/* Banner image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Banner Image <span className="font-normal text-gray-400">(optional)</span>
                  </label>

                  {/* Preview */}
                  {(bannerPreview || (flashSale?.banner_image_url && !flashForm.clearBanner)) && (
                    <div className="mb-3 relative rounded-xl overflow-hidden border border-gray-100">
                      <img
                        src={bannerPreview || flashSale.banner_image_url}
                        alt="Banner preview"
                        className="w-full h-28 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (bannerPreview) {
                            setBannerPreview(null);
                            setFlashForm(prev => ({ ...prev, bannerFile: null }));
                          } else {
                            setFlashForm(prev => ({ ...prev, clearBanner: true }));
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow"
                        title="Remove image"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setFlashForm(prev => ({ ...prev, bannerFile: file, clearBanner: false }));
                      const reader = new FileReader();
                      reader.onload = ev => setBannerPreview(ev.target.result);
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-burgundy-50 file:text-burgundy-700 hover:file:bg-burgundy-100 cursor-pointer"
                  />
                  <p className="text-xs text-gray-400 mt-1">Recommended: 1200×400px landscape. Stored in Cloudinary.</p>
                </div>

                {/* Save */}
                <button
                  type="button"
                  onClick={handleSaveFlashSale}
                  disabled={flashSaving}
                  className="w-full bg-burgundy-500 hover:bg-burgundy-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {flashSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Flash Sale Settings'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

