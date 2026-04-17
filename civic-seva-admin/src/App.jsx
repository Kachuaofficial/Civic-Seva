import { useEffect, useMemo, useState } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import IssueHeatmap from "./components/IssueHeatmap";
import civicSevaLogo from "./assets/civic-seva-logo.jpeg";
import { useReports } from "./hooks/useReports";
import { auth, googleProvider, hasPlaceholderValue, isFirebaseConfigured } from "./lib/firebase";
import "./App.css";



const heatmapFilters = [
  { id: "all", label: "All Categories" },
  { id: "highDensity", label: "High Density" },
  { id: "unresolved", label: "Unresolved" },
  { id: "northZone", label: "North Zone" },
  { id: "last24Hours", label: "Last 24 Hours" },
];

const demoNow = new Date("2026-04-17T13:00:00+05:30");
const zoneOrder = ["North Zone", "Central Zone", "East Zone"];

function AuthScreen({ onGoogleSignIn, isSigningIn, errorMessage }) {
  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-wrap">
            <img src={civicSevaLogo} alt="Civic Seva logo" className="auth-logo" />
          </div>

          <div>
            <p className="eyebrow auth-eyebrow">Secure Admin Access</p>
            <h1>Civic Seva admin sign in</h1>
            <p className="auth-copy">
              Use your Google account to access the Firebase-backed Civic Seva dashboard, heatmap,
              and complaint management views.
            </p>
          </div>
        </div>

        <div className="auth-actions">
          <button
            className="google-signin-button"
            type="button"
            onClick={onGoogleSignIn}
            disabled={!isFirebaseConfigured || isSigningIn}
          >
            {isSigningIn ? "Signing in..." : "Continue with Google"}
          </button>

          {!isFirebaseConfigured ? (
            <p className="auth-note">
              {hasPlaceholderValue
                ? "Replace the placeholder Firebase API key in `.env` with the real Web API key from Firebase console."
                : "Add your Firebase web app credentials to `.env` to enable Google authentication."}
            </p>
          ) : null}

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
        </div>
      </section>
    </div>
  );
}

function ComplaintCard({ item, onOpen }) {
  return (
    <button className="complaint-card" type="button" onClick={() => onOpen(item)}>
      <div className="complaint-top">
        <div>
          <span className="complaint-id">{item.id}</span>
          <h4>{item.title}</h4>
        </div>
        <span className={`badge badge-${item.priority.toLowerCase()}`}>{item.priority}</span>
      </div>

      <div className="complaint-meta">
        <span>{item.area}</span>
        <span>{item.category}</span>
        <span>{item.department}</span>
        <span>{item.status}</span>
      </div>
    </button>
  );
}

function ComplaintDetailsModal({ complaint, onClose }) {
  useEffect(() => {
    if (!complaint) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [complaint, onClose]);

  if (!complaint) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="complaint-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="complaint-modal-head">
          <div>
            <p className="panel-kicker">Complaint Details</p>
            <h3 id="complaint-modal-title">{complaint.title}</h3>
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="Close details">
            Close
          </button>
        </div>

        <div className="complaint-modal-topline">
          <span className="complaint-id">{complaint.id}</span>
          <span className={`badge badge-${complaint.priority.toLowerCase()}`}>{complaint.priority}</span>
        </div>

        <p className="complaint-description">{complaint.description}</p>

        <div className="complaint-detail-grid">
          <div className="detail-card">
            <span>Area</span>
            <strong>{complaint.area}</strong>
          </div>
          <div className="detail-card">
            <span>Location</span>
            <strong>{complaint.location}</strong>
          </div>
          <div className="detail-card">
            <span>Department</span>
            <strong>{complaint.department}</strong>
          </div>
          <div className="detail-card">
            <span>Status</span>
            <strong>{complaint.status}</strong>
          </div>
          <div className="detail-card">
            <span>Category</span>
            <strong>{complaint.category}</strong>
          </div>
          <div className="detail-card">
            <span>Reported By</span>
            <strong>{complaint.reportedBy}</strong>
          </div>
          <div className="detail-card">
            <span>Submitted At</span>
            <strong>{complaint.submittedAt}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ onOpenComplaint, user, onSignOut, reports }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [activeFilters, setActiveFilters] = useState({
    highDensity: false,
    unresolved: false,
    northZone: false,
    last24Hours: false,
  });

  const dynamicStats = useMemo(() => {
    const openCount = reports.filter((r) => r.status === "pending").length;
    
    const today = new Date();
    const resolvedTodayCount = reports.filter((r) => {
      if (r.status !== "fixed") return false;
      const d = new Date(r.reportedAt || Date.now());
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;

    const criticalCount = reports.filter((r) => r.priority === "Critical" || r.priority === "High").length;

    return [
      { label: "Open Reports", value: openCount.toString(), delta: "Live tracking", tone: "danger" },
      { label: "Resolved Today", value: resolvedTodayCount.toString(), delta: "Live tracking", tone: "success" },
      { label: "Critical Issues", value: criticalCount.toString(), delta: "Need urgent attention", tone: "warning" },
    ];
  }, [reports]);

  const dynamicRouting = useMemo(() => {
    const mapping = [
      { category: "Roads", team: "Public Works" },
      { category: "Sanitation", team: "Sanitation" },
      { category: "Electricity", team: "Electrical" },
      { category: "Water", team: "Water Board" },
      { category: "Public Safety", team: "Police" },
      { category: "Other", team: "General" },
    ];

    return mapping.map((m) => {
      const categoryReports = reports.filter((r) => r.category === m.category);
      const count = categoryReports.length;
      const resolved = categoryReports.filter((r) => r.status === "fixed").length;
      const progress = count > 0 ? Math.round((resolved / count) * 100) : 0;
      
      return {
        category: m.category,
        team: m.team,
        count: `${count} problems`,
        progress: progress,
      };
    });
  }, [reports]);

  const filteredLocations = useMemo(() => {
    return reports.filter((location) => {
      if (activeFilters.highDensity && location.intensity < 0.8) {
        return false;
      }

      if (activeFilters.unresolved && location.status === "Resolved") {
        return false;
      }

      if (activeFilters.northZone && location.zone !== "North Zone") {
        return false;
      }

      if (activeFilters.last24Hours) {
        const reportedAt = new Date(location.reportedAt);
        const elapsedMs = demoNow.getTime() - reportedAt.getTime();
        if (elapsedMs > 24 * 60 * 60 * 1000) {
          return false;
        }
      }

      return true;
    });
  }, [activeFilters]);

  const topCluster = filteredLocations.length
    ? filteredLocations.reduce((highest, current) =>
        current.intensity > highest.intensity ? current : highest,
      )
    : null;

  const zoneMetrics = useMemo(
    () =>
      zoneOrder.map((zone) => ({
        zone,
        reports: `${filteredLocations.filter((location) => location.zone === zone).length} reports`,
      })),
    [filteredLocations],
  );

  const previewComplaints = reports.slice(0, 3);

  const handleFilterClick = (filterId) => {
    if (filterId === "all") {
      setActiveFilters({
        highDensity: false,
        unresolved: false,
        northZone: false,
        last24Hours: false,
      });
      return;
    }

    setActiveFilters((current) => ({
      ...current,
      [filterId]: !current[filterId],
    }));
  };

  const noFilterActive = Object.values(activeFilters).every((value) => !value);
  const userInitials = (user?.displayName || "Admin User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    const sections = [
      { id: "dashboard-overview", section: "overview" },
      { id: "heatmap-monitor", section: "heatmap" },
      { id: "complaint-queue", section: "complaints" },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (!visibleEntries.length) {
          return;
        }

        const mostVisible = visibleEntries[0];
        const match = sections.find(({ id }) => id === mostVisible.target.id);
        if (match) {
          setActiveSection(match.section);
        }
      },
      {
        root: null,
        rootMargin: "-18% 0px -45% 0px",
        threshold: [0.2, 0.35, 0.55, 0.75],
      },
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">
            <img src={civicSevaLogo} alt="Civic Seva logo" className="brand-logo" />
          </div>
          <p className="eyebrow">Civic Seva Platform</p>
          <p className="sidebar-copy">
            Monitor complaints, detect hotspots, and route issues to the right city department.
          </p>
        </div>

        <nav className="sidebar-nav" aria-label="Admin sections">
          <button
            className={`nav-item ${activeSection === "overview" ? "active" : ""}`}
            type="button"
            onClick={() => scrollToSection("dashboard-overview")}
          >
            Overview
          </button>
          <button
            className={`nav-item ${activeSection === "heatmap" ? "active" : ""}`}
            type="button"
            onClick={() => scrollToSection("heatmap-monitor")}
          >
            Heatmap Monitor
          </button>
          <button
            className={`nav-item ${activeSection === "complaints" ? "active" : ""}`}
            type="button"
            onClick={() => scrollToSection("complaint-queue")}
          >
            Complaints Queue
          </button>
        </nav>

        <div className="sidebar-panel">
          <div className="account-card-top">
            <div className="account-avatar" aria-hidden="true">
              {userInitials}
            </div>
            <div className="account-copy">
              <p className="panel-label">Signed In</p>
              <strong>{user?.displayName || "Admin User"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="sidebar-signout" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main" id="dashboard-overview">
        <section className="hero-card">
          <div>
            <p className="eyebrow">Admin Dashboard Panel</p>
            <h2>Issue heatmap and complaint operations for Indian cities</h2>
            <p className="hero-copy">
              Built around your problem statement: citizen reports, location-led visibility, area-based
              filtering, and fast department assignment.
            </p>
          </div>

          <div className="hero-actions">
            <button className="primary-btn">View live complaints</button>
          </div>
        </section>

        <section className="stats-grid">
          {dynamicStats.map((stat) => (
            <article key={stat.label} className={`stat-card ${stat.tone}`}>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
              <span>{stat.delta}</span>
            </article>
          ))}
        </section>

        <section className="content-grid" id="heatmap-monitor">
          <article className="panel panel-map">
            <div className="panel-head">
              <div>
                <p className="panel-kicker">Heatmap View</p>
                <h3>Problem density by area</h3>
              </div>
              <div className="filter-row">
                {heatmapFilters.map((filter) => {
                  const isActive =
                    filter.id === "all" ? noFilterActive : activeFilters[filter.id];

                  return (
                    <button
                      key={filter.id}
                      className={`filter-chip ${isActive ? "active" : ""}`}
                      type="button"
                      onClick={() => handleFilterClick(filter.id)}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="map-layout">
              <div className="map-frame">
                <IssueHeatmap points={filteredLocations} />
                <div className="map-overlay">
                  <div className="overlay-card">
                    {topCluster ? (
                      <>
                        <span>Highest alert cluster</span>
                        <strong>
                          {topCluster.ward}, {topCluster.city}
                        </strong>
                        <p>
                          {topCluster.category} reports are driving the strongest hotspot in the current
                          filtered view.
                        </p>
                      </>
                    ) : (
                      <>
                        <span>No matching data</span>
                        <strong>Try a wider filter selection</strong>
                        <p>No complaint points match the current heatmap filters.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="legend-card">
                <h4>Zone severity</h4>
                <div className="legend-scale">
                  <span className="cool">Low</span>
                  <div className="legend-bar" />
                  <span className="hot">Critical</span>
                </div>

                <ul className="mini-metrics">
                  {zoneMetrics.map((metric) => (
                    <li key={metric.zone}>
                      <span>{metric.zone}</span>
                      <strong>{metric.reports}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <article className="panel panel-routing">
            <div className="panel-head compact">
              <div>
                <p className="panel-kicker">Department Routing</p>
                <h3>Assignment pipeline</h3>
              </div>
            </div>

            <div className="routing-list">
              {dynamicRouting.map((item) => (
                <div key={item.category} className="routing-item">
                  <div>
                    <strong>{item.category}</strong>
                    <p>{item.team}</p>
                  </div>
                  <div className="routing-meta">
                    <span>{item.count}</span>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="bottom-grid" id="complaint-queue">
          <article className="panel">
            <div className="panel-head compact panel-head-with-action">
              <div>
                <p className="panel-kicker">Complaint Queue</p>
                <h3>Recent reports requiring action</h3>
              </div>
              <Link className="view-all-button" to="/complaints">
                View all
              </Link>
            </div>

            <div className="complaint-list">
              {previewComplaints.map((item) => (
                <ComplaintCard key={item.id} item={item} onOpen={onOpenComplaint} />
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

function ComplaintsPage({ onOpenComplaint, reports }) {
  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="page-hero-copy">
          <Link className="banner-back-button" to="/" aria-label="Back to dashboard">
            <span aria-hidden="true">&larr;</span>
          </Link>
          <p className="page-eyebrow">Complaint Queue</p>
          <h1>All reported civic issues</h1>
          <p className="page-copy">
            Review every submission in one place, sorted for admin action and ready for routing.
          </p>
        </div>
      </section>

      <section className="complaints-page-grid">
        <article className="panel complaints-page-panel">
          <div className="panel-head compact">
            <div>
              <p className="panel-kicker">Full Queue</p>
              <h3>{reports.length} reports available</h3>
            </div>
          </div>

          <div className="complaint-list">
            {reports.map((item) => (
              <ComplaintCard key={item.id} item={item} onOpen={onOpenComplaint} />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function App() {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const { reports, loading: reportsLoading } = useReports();

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return undefined;
    }

    getRedirectResult(auth).catch((error) => {
      setAuthError(error.message || "Google sign-in failed after redirect. Please try again.");
    });

    return undefined;
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      setAuthError(
        hasPlaceholderValue
          ? "Firebase API key is still a placeholder. Open `.env` and replace `VITE_FIREBASE_API_KEY` with the real Web API key from Firebase."
          : "Firebase is not configured yet. Add your Firebase web app values to `.env`.",
      );
      return;
    }

    try {
      setIsSigningIn(true);
      setAuthError("");
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      if (error.code === "auth/popup-blocked" || error.code === "auth/cancelled-popup-request") {
        setAuthError("Popup was blocked, switching to secure redirect sign-in...");
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      setAuthError(error.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) {
      return;
    }

    await signOut(auth);
  };

  if (authLoading) {
    return <div className="auth-loading">Checking secure admin session...</div>;
  }

  if (!user) {
    return (
      <AuthScreen
        onGoogleSignIn={handleGoogleSignIn}
        isSigningIn={isSigningIn}
        errorMessage={authError}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              onOpenComplaint={setSelectedComplaint}
              user={user}
              onSignOut={handleSignOut}
              reports={reports}
            />
          }
        />
        <Route
          path="/complaints"
          element={<ComplaintsPage onOpenComplaint={setSelectedComplaint} reports={reports} />}
        />
      </Routes>
      <ComplaintDetailsModal complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} />
    </BrowserRouter>
  );
}

export default App;

