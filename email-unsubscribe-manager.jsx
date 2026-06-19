import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, Trash2, Filter, LogOut, RefreshCw } from 'lucide-react';

export default function EmailUnsubscribeManager() {
  const [authToken, setAuthToken] = useState(null);
  const [provider, setProvider] = useState(null);
  const [emails, setEmails] = useState([]);
  const [tieredList, setTieredList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [selectedToKeep, setSelectedToKeep] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState({ total: 0, processed: 0, unsubscribed: 0 });

  // Step 1: OAuth Login
  const handleLogin = async (emailProvider) => {
    setLoading(true);
    try {
      // Simulate OAuth flow - in production, this would redirect to Google/Microsoft OAuth
      const mockToken = `mock_${emailProvider}_token_${Date.now()}`;
      setAuthToken(mockToken);
      setProvider(emailProvider);
      
      // Simulate fetching emails
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockEmails = generateMockEmails();
      setEmails(mockEmails);
      
      // Analyze and create tiered list
      const tiered = categorizeSenders(mockEmails);
      setTieredList(tiered);
      setStats({ total: mockEmails.length, processed: 0, unsubscribed: 0 });
    } catch (error) {
      alert('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMockEmails = () => {
    const senders = [
      { email: 'adidas@us-news.comms.adidas.com', name: 'Adidas', type: 'ecommerce', count: 6 },
      { email: 'email@newsletter.mountainwarehouse.com', name: 'Mountain Warehouse', type: 'ecommerce', count: 8 },
      { email: 'ebay@reply.ebay.co.uk', name: 'eBay', type: 'ecommerce', count: 7 },
      { email: 'no-reply@emma-app.com', name: 'Emma App', type: 'saas', count: 7 },
      { email: 'hello@info.paperpal.com', name: 'Paperpal', type: 'saas', count: 3 },
      { email: 'kaplantestprep@mail.kaptest.com', name: 'Kaplan GRE', type: 'education', count: 7 },
      { email: 'teamcapterra@e.capterra.com', name: 'Capterra', type: 'saas', count: 6 },
      { email: 'prezzoitalian@email.prezzoitalian.co.uk', name: 'Prezzoitalian', type: 'restaurant', count: 7 },
      { email: 'newsletter@email.pactcoffee.com', name: 'Pact Coffee', type: 'restaurant', count: 2 },
      { email: 'hello@announcement.deliveroo.co.uk', name: 'Deliveroo', type: 'restaurant', count: 2 },
      { email: 'info@mail.surfshark.com', name: 'Surfshark', type: 'saas', count: 1 },
      { email: 'Trip.com@newsletter.trip.com', name: 'Trip.com', type: 'travel', count: 1 },
    ];

    const emails = [];
    senders.forEach(sender => {
      for (let i = 0; i < sender.count; i++) {
        emails.push({
          id: `${sender.email}_${i}`,
          from: sender.email,
          fromName: sender.name,
          subject: `Promotional email ${i + 1}`,
          type: sender.type,
          hasUnsubscribeLink: true,
          unsubscribeMethod: Math.random() > 0.3 ? 'link' : 'email',
        });
      }
    });
    return emails;
  };

  const categorizeSenders = (emailList) => {
    const senderMap = new Map();
    
    emailList.forEach(email => {
      const key = email.from;
      if (!senderMap.has(key)) {
        senderMap.set(key, {
          sender: email.from,
          name: email.fromName,
          count: 0,
          type: email.type,
          unsubscribeMethod: email.unsubscribeMethod,
        });
      }
      senderMap.get(key).count += 1;
    });

    const senders = Array.from(senderMap.values());
    
    // Categorize by type
    const categorized = {
      tier1: {
        name: 'E-commerce & Shopping',
        senders: senders.filter(s => s.type === 'ecommerce'),
        description: 'Clear promotional emails with little personal value'
      },
      tier2: {
        name: 'Services & Restaurants',
        senders: senders.filter(s => ['restaurant', 'travel'].includes(s.type)),
        description: 'Review before unsubscribing - you may use these'
      },
      tier3: {
        name: 'SaaS & Tools',
        senders: senders.filter(s => s.type === 'saas'),
        description: 'Consider if you actively use these services'
      },
      tier4: {
        name: 'Education & Other',
        senders: senders.filter(s => s.type === 'education'),
        description: 'May be useful depending on your needs'
      }
    };

    return categorized;
  };

  const handleKeepToggle = (sender) => {
    const newSet = new Set(selectedToKeep);
    const key = sender.sender;
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedToKeep(newSet);
  };

  // Step 3: Automated Unsubscribe
  const handleUnsubscribeAll = async () => {
    if (!tieredList) return;
    
    const allSenders = [
      ...tieredList.tier1.senders,
      ...tieredList.tier2.senders,
      ...tieredList.tier3.senders,
      ...tieredList.tier4.senders,
    ];

    const sendersToUnsubscribe = allSenders.filter(s => !selectedToKeep.has(s.sender));
    
    if (sendersToUnsubscribe.length === 0) {
      alert('No senders to unsubscribe from!');
      return;
    }

    setUnsubscribing(true);
    try {
      // Simulate unsubscribe process
      for (let i = 0; i < sendersToUnsubscribe.length; i++) {
        const sender = sendersToUnsubscribe[i];
        
        // Simulate API call to process unsubscribe
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setStats(prev => ({
          ...prev,
          processed: i + 1,
          unsubscribed: Math.ceil((i + 1) * 0.95) // Simulate ~95% success rate
        }));
      }
      
      setSuccessMessage(`✓ Successfully processed ${sendersToUnsubscribe.length} senders!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      alert('Error during unsubscribe: ' + error.message);
    } finally {
      setUnsubscribing(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setProvider(null);
    setEmails([]);
    setTieredList(null);
    setSelectedToKeep(new Set());
    setStats({ total: 0, processed: 0, unsubscribed: 0 });
  };

  // Landing / Login Screen
  if (!authToken) {
    return (
      <div style={styles.container}>
        <div style={styles.hero}>
          <Mail size={48} style={styles.heroIcon} />
          <h1 style={styles.heading}>Inbox Cleaner</h1>
          <p style={styles.tagline}>Automatically unsubscribe from promotional emails and reclaim your inbox</p>
          
          <div style={styles.features}>
            <div style={styles.feature}>
              <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
              <span>Connect your Gmail or Outlook</span>
            </div>
            <div style={styles.feature}>
              <Filter size={20} style={{ color: '#22c55e' }} />
              <span>Smart categorization of promotional senders</span>
            </div>
            <div style={styles.feature}>
              <Trash2 size={20} style={{ color: '#22c55e' }} />
              <span>One-click unsubscribe from all (with your approval)</span>
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button 
              onClick={() => handleLogin('gmail')}
              disabled={loading}
              style={{...styles.button, ...styles.buttonPrimary}}
            >
              {loading ? 'Connecting...' : 'Login with Gmail'}
            </button>
            <button 
              onClick={() => handleLogin('outlook')}
              disabled={loading}
              style={{...styles.button, ...styles.buttonSecondary}}
            >
              {loading ? 'Connecting...' : 'Login with Outlook'}
            </button>
          </div>

          <p style={styles.disclaimer}>
            🔒 Your data stays private. We only process emails to identify promotional senders.
          </p>
        </div>
      </div>
    );
  }

  // Main App Screen
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Mail size={24} style={{ marginRight: '8px' }} />
          <h1 style={styles.appTitle}>Inbox Cleaner</h1>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.badge}>{provider?.toUpperCase()}</span>
          <button 
            onClick={handleLogout}
            style={styles.logoutBtn}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={styles.successMessage}>
          {successMessage}
        </div>
      )}

      {!tieredList ? (
        <div style={styles.loadingContainer}>
          <RefreshCw size={32} style={styles.spinner} />
          <p>Analyzing your emails...</p>
        </div>
      ) : (
        <div style={styles.content}>
          {/* Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{stats.total}</div>
              <div style={styles.statLabel}>Total Promotional Emails</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{Object.values(tieredList).reduce((sum, tier) => sum + tier.senders.length, 0)}</div>
              <div style={styles.statLabel}>Unique Senders</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>{selectedToKeep.size}</div>
              <div style={styles.statLabel}>Marked to Keep</div>
            </div>
          </div>

          {/* Instructions */}
          <div style={styles.instructions}>
            <AlertCircle size={18} style={{ marginRight: '8px' }} />
            <div>
              <strong>Review senders below.</strong> Check the box next to any you want to keep receiving emails from. We'll unsubscribe from the rest.
            </div>
          </div>

          {/* Tier Lists */}
          {Object.entries(tieredList).map(([tierKey, tier]) => (
            <div key={tierKey} style={styles.tierSection}>
              <div style={styles.tierHeader}>
                <h2 style={styles.tierTitle}>{tier.name}</h2>
                <p style={styles.tierDescription}>{tier.description}</p>
              </div>

              <div style={styles.sendersList}>
                {tier.senders.length === 0 ? (
                  <p style={styles.emptyMessage}>No senders in this category</p>
                ) : (
                  tier.senders.map(sender => (
                    <div key={sender.sender} style={styles.senderItem}>
                      <label style={styles.senderLabel}>
                        <input
                          type="checkbox"
                          checked={selectedToKeep.has(sender.sender)}
                          onChange={() => handleKeepToggle(sender)}
                          style={styles.checkbox}
                        />
                        <div style={styles.senderInfo}>
                          <div style={styles.senderName}>{sender.name}</div>
                          <div style={styles.senderEmail}>{sender.sender}</div>
                        </div>
                      </label>
                      <div style={styles.senderCount}>{sender.count} emails</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}

          {/* Action Button */}
          <div style={styles.actionBar}>
            <button
              onClick={handleUnsubscribeAll}
              disabled={unsubscribing}
              style={{
                ...styles.button,
                ...styles.buttonDanger,
                opacity: unsubscribing ? 0.7 : 1,
                cursor: unsubscribing ? 'not-allowed' : 'pointer'
              }}
            >
              {unsubscribing ? `Processing... (${stats.processed}/${stats.total})` : 'Unsubscribe from Selected'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f7f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#1a1a1a',
  },
  
  // Login Screen
  hero: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '60px 20px',
    textAlign: 'center',
  },
  heroIcon: {
    color: '#0ea5e9',
    marginBottom: '20px',
  },
  heading: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '12px',
    lineHeight: 1.2,
  },
  tagline: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '40px',
    lineHeight: 1.5,
  },
  features: {
    marginBottom: '40px',
    textAlign: 'left',
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    marginBottom: '12px',
    color: '#333',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexDirection: 'column',
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    backgroundColor: '#0ea5e9',
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: '#e5e5e5',
    color: '#1a1a1a',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
    color: 'white',
  },
  disclaimer: {
    fontSize: '12px',
    color: '#999',
    marginTop: '20px',
  },

  // Header
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e5e5',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  appTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  badge: {
    backgroundColor: '#0ea5e9',
    color: 'white',
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: '4px',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },

  // Main Content
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  
  successMessage: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '12px 16px',
    borderRadius: '6px',
    margin: '20px auto',
    maxWidth: '800px',
    fontSize: '14px',
    fontWeight: 500,
  },

  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
    color: '#666',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0ea5e9',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 500,
  },

  // Instructions
  instructions: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: '#1e40af',
  },

  // Tier Sections
  tierSection: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e5e5',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  tierHeader: {
    backgroundColor: '#f8f7f6',
    padding: '16px',
    borderBottom: '1px solid #e5e5e5',
  },
  tierTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 4px 0',
  },
  tierDescription: {
    fontSize: '13px',
    color: '#666',
    margin: '4px 0 0 0',
  },

  sendersList: {
    padding: '0',
  },
  senderItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
  },
  senderLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    cursor: 'pointer',
    userSelect: 'none',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1a1a1a',
  },
  senderEmail: {
    fontSize: '12px',
    color: '#999',
    marginTop: '2px',
  },
  senderCount: {
    fontSize: '12px',
    color: '#999',
    whiteSpace: 'nowrap',
    marginLeft: '12px',
  },
  emptyMessage: {
    padding: '16px',
    color: '#999',
    textAlign: 'center',
    fontSize: '13px',
  },

  // Action Bar
  actionBar: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
};

// Add animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
