import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { showToast } from "../components/ToastContainer";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthToken = () => sessionStorage.getItem("jobbridge_token");

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "An error occurred");
  }

  return data;
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    userType: "",
    isActive: "",
    search: "",
    page: 1,
  });
  const [jobFilters, setJobFilters] = useState({
    status: "",
    search: "",
    page: 1,
  });
  const [pagination, setPagination] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobPagination, setJobPagination] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetailsModal, setJobDetailsModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    status: "",
    page: 1,
  });
  const [reportPagination, setReportPagination] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDetailsModal, setReportDetailsModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null,
    userId: null,
    userName: "",
    currentStatus: null,
  });
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user?.userType !== "admin") {
      navigate("/");
      showToast("Access denied. Admin privileges required.", "error");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "jobs") {
      fetchJobs();
    } else if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab, filters, jobFilters, reportFilters]);

  const fetchStats = async () => {
    try {
      const response = await apiRequest("/admin/reports/stats");
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
      showToast("Failed to fetch statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.userType) params.append("userType", filters.userType);
      if (filters.isActive) params.append("isActive", filters.isActive);
      if (filters.search) params.append("search", filters.search);
      params.append("page", filters.page);
      params.append("limit", 20);

      const response = await apiRequest(`/admin/users?${params}`);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (jobFilters.status) params.append("status", jobFilters.status);
      if (jobFilters.search) params.append("search", jobFilters.search);
      params.append("page", jobFilters.page);
      params.append("limit", 20);

      const response = await apiRequest(`/admin/jobs?${params}`);
      if (response.success) {
        setJobs(response.data.jobs);
        setJobPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Fetch jobs error:", error);
      showToast("Failed to fetch jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async (jobId) => {
    try {
      const response = await apiRequest(`/admin/jobs/${jobId}`);
      if (response.success) {
        setSelectedJob(response.data);
        setJobDetailsModal(true);
      }
    } catch (error) {
      console.error("Fetch job details error:", error);
      showToast("Failed to fetch job details", "error");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (reportFilters.status) params.append("status", reportFilters.status);
      params.append("page", reportFilters.page);
      params.append("limit", 20);

      const response = await apiRequest(`/admin/reports?${params}`);
      if (response.success) {
        setReports(response.data.reports);
        setReportPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Fetch reports error:", error);
      showToast("Failed to fetch reports", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetails = async (reportId) => {
    try {
      const response = await apiRequest(`/admin/reports/${reportId}`);
      if (response.success) {
        setSelectedReport(response.data);
        setReportDetailsModal(true);
      }
    } catch (error) {
      console.error("Fetch report details error:", error);
      showToast("Failed to fetch report details", "error");
    }
  };

  const handleReportAction = async (
    reportId,
    status,
    actionTaken,
    adminNotes,
  ) => {
    try {
      const response = await apiRequest(`/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, actionTaken, adminNotes }),
      });
      if (response.success) {
        showToast(response.message, "success");
        setReportDetailsModal(false);
        fetchReports();
      }
    } catch (error) {
      console.error("Update report error:", error);
      showToast("Failed to update report", "error");
    }
  };

  const openConfirmModal = (action, userId, userName, currentStatus = null) => {
    setConfirmModal({
      isOpen: true,
      action,
      userId,
      userName,
      currentStatus,
    });
    setPassword("");
    setPasswordError("");
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      action: null,
      userId: null,
      userName: "",
      currentStatus: null,
    });
    setPassword("");
    setPasswordError("");
  };

  const verifyPassword = async () => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    }

    try {
      // Verify admin password
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          password: password,
        }),
      });

      if (response.success) {
        return true;
      }
    } catch (error) {
      setPasswordError("Invalid password");
      return false;
    }
  };

  const handleConfirmAction = async () => {
    const isPasswordValid = await verifyPassword();
    if (!isPasswordValid) {
      return;
    }

    if (confirmModal.action === "toggle") {
      await handleToggleUserStatus(
        confirmModal.userId,
        confirmModal.currentStatus,
      );
    } else if (confirmModal.action === "delete") {
      await handleDeleteUser(confirmModal.userId);
    }

    closeConfirmModal();
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await apiRequest(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.success) {
        showToast(response.message, "success");
        fetchUsers();
      }
    } catch (error) {
      console.error("Toggle user status error:", error);
      showToast("Failed to update user status", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await apiRequest(`/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (response.success) {
        showToast(response.message, "success");
        fetchUsers();
      }
    } catch (error) {
      console.error("Delete user error:", error);
      showToast(error.message || "Failed to delete user", "error");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
            Admin <span className="gradient-text">Dashboard</span> 🛡️
          </h1>
          <p className="text-slate-300 text-lg">
            Manage users and view system reports
          </p>
        </div>

        <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl mb-6">
          <div className="border-b border-dark-700/50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === "overview"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-dark-600"
                }`}
              >
                📊 Overview & Reports
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === "users"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-dark-600"
                }`}
              >
                👥 Manage Users
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === "jobs"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-dark-600"
                }`}
              >
                💼 Manage Jobs
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                  activeTab === "reports"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-dark-600"
                }`}
              >
                🚨 Job Reports
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "overview" && stats && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.users.total}
                subtitle=""
                icon="👥"
                gradient="from-blue-500 to-cyan-500"
              />
              <StatCard
                title="Job Seekers"
                value={stats.users.jobSeekers}
                subtitle=""
                icon="🔍"
                gradient="from-green-500 to-emerald-500"
              />
              <StatCard
                title="Employers"
                value={stats.users.employers}
                subtitle=""
                icon="🏢"
                gradient="from-purple-500 to-pink-500"
              />
              <StatCard
                title="Total Jobs"
                value={stats.jobs.total}
                subtitle=""
                icon="💼"
                gradient="from-orange-500 to-red-500"
              />
            </div>

            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-100">
                📋 Application Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-dark-900/50 rounded-lg border border-dark-700/30">
                  <p className="text-3xl font-bold text-slate-100">
                    {stats.applications.total}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Total</p>
                </div>
                <div className="text-center p-4 bg-dark-900/50 rounded-lg border border-yellow-500/20">
                  <p className="text-3xl font-bold text-yellow-400">
                    {stats.applications.pending}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Pending</p>
                </div>
                <div className="text-center p-4 bg-dark-900/50 rounded-lg border border-blue-500/20">
                  <p className="text-3xl font-bold text-blue-400">
                    {stats.applications.reviewed}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Reviewed</p>
                </div>
                <div className="text-center p-4 bg-dark-900/50 rounded-lg border border-green-500/20">
                  <p className="text-3xl font-bold text-green-400">
                    {stats.applications.accepted}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Accepted</p>
                </div>
                <div className="text-center p-4 bg-dark-900/50 rounded-lg border border-red-500/20">
                  <p className="text-3xl font-bold text-red-400">
                    {stats.applications.rejected}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Rejected</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-100">
                  🆕 Recent Users
                </h2>
                <div className="space-y-3">
                  {stats.recentActivity.users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between py-3 px-4 bg-dark-900/50 rounded-lg border border-dark-700/30 hover:border-dark-600/50 transition-all"
                    >
                      <div>
                        <p className="font-medium text-slate-200">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full border ${user.userType === "employer" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}
                        >
                          {user.userType}
                        </span>
                        {user.isEmailVerified && (
                          <span className="text-green-400" title="Verified">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-100">
                  💼 Recent Jobs
                </h2>
                <div className="space-y-3">
                  {stats.recentActivity.jobs.map((job) => (
                    <div
                      key={job._id}
                      className="py-3 px-4 bg-dark-900/50 rounded-lg border border-dark-700/30 hover:border-dark-600/50 transition-all"
                    >
                      <p className="font-medium text-slate-200">{job.title}</p>
                      <p className="text-sm text-slate-400">
                        {job.companyName} • {job.location}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${job.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}
                        >
                          {job.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value, page: 1 })
                  }
                  className="px-4 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <select
                  value={filters.userType}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      userType: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All User Types</option>
                  <option value="jobseeker">Job Seekers</option>
                  <option value="employer">Employers</option>
                </select>
                <select
                  value={filters.isActive}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      isActive: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button
                  onClick={() =>
                    setFilters({
                      userType: "",
                      isActive: "",
                      search: "",
                      page: 1,
                    })
                  }
                  className="px-4 py-2 bg-dark-700/50 text-slate-300 rounded-lg hover:bg-dark-700 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-700/50">
                  <thead className="bg-dark-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/30">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-dark-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-200">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full border ${user.userType === "employer" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}
                          >
                            {user.userType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full border ${user.isActive ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                            >
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                            {user.isEmailVerified && (
                              <span
                                className="text-green-400"
                                title="Email Verified"
                              >
                                ✓
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() =>
                              openConfirmModal(
                                "toggle",
                                user._id,
                                `${user.firstName} ${user.lastName}`,
                                user.isActive,
                              )
                            }
                            className={`px-3 py-1 text-sm rounded-lg transition-all ${user.isActive ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"}`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() =>
                              openConfirmModal(
                                "delete",
                                user._id,
                                `${user.firstName} ${user.lastName}`,
                              )
                            }
                            className="px-3 py-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 bg-dark-900/30 border-t border-dark-700/50 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    )}{" "}
                    of {pagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page - 1 })
                      }
                      disabled={filters.page === 1}
                      className="px-4 py-2 bg-dark-700/50 border border-dark-600/50 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page + 1 })
                      }
                      disabled={filters.page === pagination.pages}
                      className="px-4 py-2 bg-dark-700/50 border border-dark-600/50 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={jobFilters.search}
                  onChange={(e) =>
                    setJobFilters({
                      ...jobFilters,
                      search: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <select
                  value={jobFilters.status}
                  onChange={(e) =>
                    setJobFilters({
                      ...jobFilters,
                      status: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
                <button
                  onClick={() =>
                    setJobFilters({ status: "", search: "", page: 1 })
                  }
                  className="px-4 py-2 bg-dark-700/50 text-slate-300 rounded-lg hover:bg-dark-700 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-700/50">
                  <thead className="bg-dark-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Applications
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Posted
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/30">
                    {jobs.map((job) => (
                      <tr
                        key={job._id}
                        className="hover:bg-dark-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-200">
                            {job.title}
                          </p>
                          <p className="text-sm text-slate-400">
                            {job.jobType} • {job.workMode}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {job.companyName}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {job.location}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full border ${job.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : job.status === "closed" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-200 font-medium">
                            {job.applicationCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {formatDate(job.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => fetchJobDetails(job._id)}
                            className="px-3 py-1 text-sm bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/30 transition-all"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {jobPagination && jobPagination.pages > 1 && (
                <div className="px-6 py-4 bg-dark-900/30 border-t border-dark-700/50 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Showing {(jobPagination.page - 1) * jobPagination.limit + 1}{" "}
                    to{" "}
                    {Math.min(
                      jobPagination.page * jobPagination.limit,
                      jobPagination.total,
                    )}{" "}
                    of {jobPagination.total} jobs
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setJobFilters({
                          ...jobFilters,
                          page: jobFilters.page - 1,
                        })
                      }
                      disabled={jobFilters.page === 1}
                      className="px-4 py-2 bg-dark-700/50 border border-dark-600/50 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setJobFilters({
                          ...jobFilters,
                          page: jobFilters.page + 1,
                        })
                      }
                      disabled={jobFilters.page === jobPagination.pages}
                      className="px-4 py-2 bg-dark-700/50 border border-dark-600/50 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={reportFilters.status}
                  onChange={(e) =>
                    setReportFilters({
                      ...reportFilters,
                      status: e.target.value,
                      page: 1,
                    })
                  }
                  className="px-4 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="action-taken">Action Taken</option>
                </select>
                <button
                  onClick={() => setReportFilters({ status: "", page: 1 })}
                  className="px-4 py-2 bg-dark-700/50 text-slate-300 rounded-lg hover:bg-dark-700 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-dark-700/50">
                  <thead className="bg-dark-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Job
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Reported
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/30">
                    {reports.map((report) => (
                      <tr
                        key={report._id}
                        className="hover:bg-dark-900/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-200">
                            {report.job?.title || "Deleted Job"}
                          </p>
                          <p className="text-sm text-slate-400">
                            {report.job?.companyName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-300">
                            {report.reporter?.firstName}{" "}
                            {report.reporter?.lastName}
                          </p>
                          <p className="text-sm text-slate-400">
                            {report.reporter?.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2 py-1 text-xs rounded-full border bg-orange-500/20 text-orange-400 border-orange-500/30">
                            {report.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full border ${
                              report.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : report.status === "reviewed"
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  : report.status === "action-taken"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => fetchReportDetails(report._id)}
                            className="px-3 py-1 text-sm bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-lg hover:bg-primary-500/30 transition-all"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {reportPagination && reportPagination.pages > 1 && (
                <div className="px-6 py-4 bg-dark-900/30 border-t border-dark-700/50 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Showing{" "}
                    {(reportPagination.page - 1) * reportPagination.limit + 1}{" "}
                    to{" "}
                    {Math.min(
                      reportPagination.page * reportPagination.limit,
                      reportPagination.total,
                    )}{" "}
                    of {reportPagination.total} reports
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setReportFilters({
                          ...reportFilters,
                          page: reportFilters.page - 1,
                        })
                      }
                      disabled={reportFilters.page === 1}
                      className="px-4 py-2 bg-dark-700/50 border border-dark-600/50 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setReportFilters({
                          ...reportFilters,
                          page: reportFilters.page + 1,
                        })
                      }
                      disabled={reportFilters.page === reportPagination.pages}
                      className="px-4 py-2 bg-dark-700/50 border border-dark-600/50 text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-dark-700 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Report Details Modal */}
      {reportDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">
                Report Details
              </h3>
              <button
                onClick={() => setReportDetailsModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Side - Report Details (2/3 width) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
                  <h4 className="text-sm font-semibold text-slate-100 mb-2">
                    Reported Job
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Title:</span>
                      <span className="text-slate-200">
                        {selectedReport.report.job?.title}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Company:</span>
                      <span className="text-slate-200">
                        {selectedReport.report.job?.companyName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-200">
                        {selectedReport.report.job?.location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Job Status:</span>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full border ${
                          selectedReport.report.job?.status === "active"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {selectedReport.report.job?.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedJob({
                        job: selectedReport.report.job,
                        applicationStats: {
                          total: 0,
                          pending: 0,
                          accepted: 0,
                          rejected: 0,
                        },
                        employer: selectedReport.employer || {},
                      });
                      setJobDetailsModal(true);
                    }}
                    className="w-full mt-3 px-3 py-1.5 text-sm bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded hover:bg-primary-500/30 transition-all"
                  >
                    View Full Job Details
                  </button>
                </div>

                <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
                  <h4 className="text-sm font-semibold text-slate-100 mb-2">
                    Report Information
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Reason:</p>
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full border bg-orange-500/20 text-orange-400 border-orange-500/30">
                        {selectedReport.report.reason}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">
                        Description:
                      </p>
                      <p className="text-slate-200 text-sm bg-dark-800/50 p-2 rounded">
                        {selectedReport.report.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Status:</p>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full border ${
                          selectedReport.report.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : selectedReport.report.status === "reviewed"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : selectedReport.report.status === "action-taken"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {selectedReport.report.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Reported on:</span>
                      <span className="text-slate-200">
                        {formatDate(selectedReport.report.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
                  <h4 className="text-sm font-semibold text-slate-100 mb-2">
                    Reporter & Employer
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 mb-1">Reporter:</p>
                      <p className="text-slate-200">
                        {selectedReport.report.reporter?.firstName}{" "}
                        {selectedReport.report.reporter?.lastName}
                      </p>
                      <p className="text-slate-400">
                        {selectedReport.report.reporter?.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Employer:</p>
                      <p className="text-slate-200">
                        {selectedReport.employer?.firstName}{" "}
                        {selectedReport.employer?.lastName}
                      </p>
                      <p className="text-slate-400">
                        {selectedReport.employer?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedReport.report.adminNotes && (
                  <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
                    <h4 className="text-sm font-semibold text-slate-100 mb-1">
                      Admin Notes
                    </h4>
                    <p className="text-slate-300 text-sm">
                      {selectedReport.report.adminNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side - Action Buttons (1/3 width, sticky) */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-20">
                  <div className="bg-dark-900/50 rounded-lg p-3 border border-dark-700/30">
                    <h4 className="text-sm font-semibold text-slate-100 mb-3">
                      Take Action
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() =>
                          handleReportAction(
                            selectedReport.report._id,
                            "dismissed",
                            "none",
                            "Report reviewed and dismissed",
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-slate-500/20 text-slate-400 border border-slate-500/30 rounded hover:bg-slate-500/30 transition-all text-left"
                      >
                        Dismiss Report
                      </button>
                      <button
                        onClick={() =>
                          handleReportAction(
                            selectedReport.report._id,
                            "reviewed",
                            "none",
                            "Report reviewed, no action needed",
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-all text-left"
                      >
                        Mark as Reviewed
                      </button>
                      <button
                        onClick={() =>
                          handleReportAction(
                            selectedReport.report._id,
                            "action-taken",
                            "employer-warned",
                            "Employer warned about policy violation",
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded hover:bg-yellow-500/30 transition-all text-left"
                      >
                        Warn Employer
                      </button>
                      <button
                        onClick={() =>
                          handleReportAction(
                            selectedReport.report._id,
                            "action-taken",
                            "job-removed",
                            "Job removed due to policy violation",
                          )
                        }
                        className="w-full px-3 py-2 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-all text-left"
                      >
                        Remove Job
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {jobDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">Job Details</h3>
              <button
                onClick={() => setJobDetailsModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                <h4 className="text-xl font-semibold text-slate-100 mb-2">
                  {selectedJob.job.title}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Company</p>
                    <p className="text-slate-200">
                      {selectedJob.job.companyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Location</p>
                    <p className="text-slate-200">{selectedJob.job.location}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Job Type</p>
                    <p className="text-slate-200">{selectedJob.job.jobType}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Work Mode</p>
                    <p className="text-slate-200">{selectedJob.job.workMode}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Experience Level</p>
                    <p className="text-slate-200">
                      {selectedJob.job.experienceLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full border ${selectedJob.job.status === "active" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}
                    >
                      {selectedJob.job.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">
                  Application Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-100">
                      {selectedJob.applicationStats.total}
                    </p>
                    <p className="text-sm text-slate-400">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">
                      {selectedJob.applicationStats.pending}
                    </p>
                    <p className="text-sm text-slate-400">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">
                      {selectedJob.applicationStats.accepted}
                    </p>
                    <p className="text-sm text-slate-400">Accepted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {selectedJob.applicationStats.rejected}
                    </p>
                    <p className="text-sm text-slate-400">Rejected</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                <h4 className="text-lg font-semibold text-slate-100 mb-3">
                  Employer Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="text-slate-200">
                      {selectedJob.employer?.firstName || "N/A"}{" "}
                      {selectedJob.employer?.lastName || ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-200">
                      {selectedJob.employer?.email || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Posted On:</span>
                    <span className="text-slate-200">
                      {formatDate(selectedJob.job.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedJob.job.description && (
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                  <h4 className="text-lg font-semibold text-slate-100 mb-3">
                    Job Description
                  </h4>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">
                    {selectedJob.job.description}
                  </p>
                </div>
              )}

              {selectedJob.job.requirements &&
                selectedJob.job.requirements.length > 0 && (
                  <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                    <h4 className="text-lg font-semibold text-slate-100 mb-3">
                      Requirements
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                      {selectedJob.job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedJob.job.benefits &&
                selectedJob.job.benefits.length > 0 && (
                  <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                    <h4 className="text-lg font-semibold text-slate-100 mb-3">
                      Benefits
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                      {selectedJob.job.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedJob.job.salary &&
                (selectedJob.job.salary.min || selectedJob.job.salary.max) && (
                  <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-700/30">
                    <h4 className="text-lg font-semibold text-slate-100 mb-3">
                      Salary Range
                    </h4>
                    <p className="text-slate-300 text-sm">
                      {selectedJob.job.salary.min && selectedJob.job.salary.max
                        ? `${selectedJob.job.salary.min.toLocaleString()} - ${selectedJob.job.salary.max.toLocaleString()}`
                        : selectedJob.job.salary.min
                          ? `From ${selectedJob.job.salary.min.toLocaleString()}`
                          : `Up to ${selectedJob.job.salary.max.toLocaleString()}`}
                    </p>
                  </div>
                )}

              <button
                onClick={() => setJobDetailsModal(false)}
                className="w-full px-4 py-2 bg-dark-700/50 text-slate-300 rounded-lg hover:bg-dark-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.action === "delete" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}
              >
                {confirmModal.action === "delete" ? "🗑️" : "⚠️"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  {confirmModal.action === "delete"
                    ? "Delete User"
                    : confirmModal.currentStatus
                      ? "Deactivate User"
                      : "Activate User"}
                </h3>
                <p className="text-sm text-slate-400">Confirm your action</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-slate-300 mb-4">
                {confirmModal.action === "delete" ? (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <span className="font-semibold text-slate-100">
                      {confirmModal.userName}
                    </span>
                    ? This action cannot be undone and will remove all
                    associated data.
                  </>
                ) : (
                  <>
                    Are you sure you want to{" "}
                    {confirmModal.currentStatus ? "deactivate" : "activate"}{" "}
                    <span className="font-semibold text-slate-100">
                      {confirmModal.userName}
                    </span>
                    ?
                  </>
                )}
              </p>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Enter your admin password to confirm
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleConfirmAction();
                    }
                  }}
                  placeholder="Your password"
                  className="w-full px-4 py-2 bg-dark-900/50 border border-dark-700/50 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <span>⚠️</span> {passwordError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2 bg-dark-700/50 text-slate-300 rounded-lg hover:bg-dark-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={!password}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  confirmModal.action === "delete"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {confirmModal.action === "delete"
                  ? "Delete User"
                  : confirmModal.currentStatus
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, gradient }) => {
  return (
    <div className="bg-dark-800/50 backdrop-blur-xl border border-dark-700/50 rounded-xl p-6 hover:border-dark-600/50 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-100">{value}</p>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div
          className={`text-4xl w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center opacity-80`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
