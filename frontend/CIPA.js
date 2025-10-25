import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Clock, Save, Send, CheckCircle, Calendar, MapPin, Trash2, Menu, X } from 'lucide-react';

export default function CIPAWatchApp() {
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [isAlarmActive, setIsAlarmActive] = useState(true);
  const [alarmStatus, setAlarmStatus] = useState('active');
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  const [injuryLocation, setInjuryLocation] = useState('');
  const [injuryNotes, setInjuryNotes] = useState('');
  const [injuryPhoto, setInjuryPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [injuryHistory, setInjuryHistory] = useState([]);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  
  const [menuOpen, setMenuOpen] = useState(false);
  
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Load injury history from storage on mount
  useEffect(() => {
    loadInjuryHistory();
  }, []);

  const loadInjuryHistory = async () => {
    try {
      const keys = await window.storage.list('injury:');
      if (keys && keys.keys) {
        const injuries = [];
        for (const key of keys.keys) {
          try {
            const result = await window.storage.get(key);
            if (result && result.value) {
              injuries.push(JSON.parse(result.value));
            }
          } catch (err) {
            console.log('Key not found:', key);
          }
        }
        injuries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setInjuryHistory(injuries);
      }
    } catch (error) {
      console.log('No injury history found yet');
      setInjuryHistory([]);
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (isAlarmActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            triggerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAlarmActive, timeRemaining]);

  const triggerAlarm = () => {
    setIsAlarmActive(false);
    setAlarmStatus('alert');
    
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
    
    if (notificationPermission === 'granted') {
      new Notification('⚠️ HEAT & HYDRATION CHECK!', {
        body: 'Immediately check your temp, rest, and drink water. Look for any new injuries.',
        icon: '🌡️',
        requireInteraction: true,
        tag: 'cipa-alarm'
      });
    }
  };

  const acknowledgeAlarm = () => {
    setTimeRemaining(1800);
    setIsAlarmActive(true);
    setAlarmStatus('active');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleInjurySubmit = async (e) => {
    e.preventDefault();
    
    const injuryData = {
      id: `injury_${Date.now()}`,
      location: injuryLocation,
      notes: injuryNotes,
      timestamp: new Date().toISOString()
    };
    
    try {
      await window.storage.set(`injury:${injuryData.id}`, JSON.stringify(injuryData));
      console.log('Injury logged:', injuryData);
      
      setShowSuccessMessage(true);
      setInjuryLocation('');
      setInjuryNotes('');
      
      await loadInjuryHistory();
      
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Error saving injury:', error);
      alert('Failed to save injury log. Please try again.');
    }
  };

  const deleteInjury = async (injuryId) => {
    try {
      await window.storage.delete(`injury:${injuryId}`);
      await loadInjuryHistory();
    } catch (error) {
      console.error('Error deleting injury:', error);
    }
  };

  const getHealingSuggestion = (location, notes) => {
    const lowerNotes = (notes || '').toLowerCase();
    const lowerLocation = (location || '').toLowerCase();
    
    if (lowerLocation.includes('joint') || lowerLocation.includes('knee') || 
        lowerLocation.includes('ankle') || lowerLocation.includes('elbow')) {
      return "🦴 Joint/Bone Concern: Non-healing wounds or joint injuries require immediate clinical review. Ensure the limb is protected and consider non-weight-bearing. Check daily for signs of infection (warmth, swelling, redness). Charcot joints can develop without pain - seek orthopedic evaluation if you notice any deformity or instability.";
    }
    
    if (lowerNotes.includes('burn') || lowerNotes.includes('hot') || lowerNotes.includes('heat')) {
      return "🔥 Thermal Injury: Burns are common in CIPA. Apply cool (not ice-cold) water immediately. Keep the area clean and covered. Monitor for blistering or signs of infection. Even minor burns can become serious - consult your doctor if the wound doesn't improve within 48 hours.";
    }
    
    if (lowerNotes.includes('swelling') || lowerNotes.includes('swollen')) {
      return "⚠️ Swelling Detected: Swelling without pain can indicate serious injury. Elevate the affected area and apply ice (with caution - set timers!). Monitor for warmth, which may indicate infection. Avoid putting weight or pressure on the area until medically evaluated.";
    }
    
    if (lowerNotes.includes('red') || lowerNotes.includes('redness')) {
      return "🔴 Redness Noted: Redness can be a sign of infection or inflammation. Keep the area meticulously clean. Watch for spreading redness, warmth, or discharge. Take photos daily to track progression. Seek medical attention if redness spreads or if you develop fever.";
    }
    
    if (lowerLocation.includes('mouth') || lowerLocation.includes('teeth') || lowerLocation.includes('tongue')) {
      return "🦷 Oral Injury: Mouth and dental injuries are common in CIPA due to lack of pain feedback. Rinse with salt water. Avoid hot foods and beverages. Schedule regular dental check-ups every 3-4 months. Self-inflicted injuries (biting) may require protective measures or behavioral therapy.";
    }
    
    return "⚕️ General CIPA Care: Clean the area gently with mild soap and water. Apply antibiotic ointment and cover with a clean bandage. Check the wound daily for signs of infection: unusual warmth, increased swelling, discharge, or foul odor. Change bandages regularly. Avoid putting pressure on the injured area. Document healing progress with photos. If the wound doesn't show improvement within 3-5 days, or if you notice any concerning changes, contact your healthcare provider immediately.";
  };

  const handleAISubmit = () => {
    if (!aiPrompt.trim()) return;
    
    const responses = [
      `Thank you for sharing your concern. That sounds like an important question about "${aiPrompt.substring(0, 40)}...". Remember that managing CIPA requires constant vigilance and regular check-ins with medical professionals. For any physical symptoms or concerns, please consult your CIPA specialist or a trusted guardian immediately. This response is only for emotional support and general guidance. *[Simulated AI Response - Not Medical Advice]*`,
      `I understand you're asking about "${aiPrompt.substring(0, 40)}...". That's a very important question, and it sounds like you're managing a lot. For any medical or physical concern, please remember to consult your CIPA specialist, orthopedic surgeon, or a trusted guardian. Your safety is the top priority. This is only a supportive response. *[Simulated AI Response - Not Medical Advice]*`,
      `Your question about "${aiPrompt.substring(0, 40)}..." shows you're being thoughtful about your health. For CIPA patients, it's crucial to maintain regular medical appointments and report any changes immediately. Please discuss this specific concern with your healthcare team who knows your complete medical history. *[Simulated AI Response - Not Medical Advice]*`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    setAiResponse(randomResponse);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDGH0fPTgjMGHm7A7+OZURE=" />
      
      {/* Header with Hamburger Menu */}
      <header className="bg-gray-900 border-b-2 border-red-600 sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-red-500">CIPA Watch</h1>
          </div>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="w-6 h-6 text-red-500" />
            ) : (
              <Menu className="w-6 h-6 text-red-500" />
            )}
          </button>
        </div>
        
        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="bg-gray-800 border-t border-gray-700 shadow-xl">
            <div className="max-w-4xl mx-auto">
              <nav className="py-2">
                <a
                  href="#alarm"
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  🔔 Digital Alarm
                </a>
                <a
                  href="#log"
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  📝 Log Injury
                </a>
                <a
                  href="#ai"
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  🧠 AI Assistant
                </a>
                <a
                  href="#history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  📅 Injury History
                </a>
                <a
                  href="knowledge.html"
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-4 text-blue-400 font-bold hover:bg-gray-700 hover:text-blue-300 transition-colors border-t border-gray-700"
                >
                  📚 CIPA Knowledge Center
                </a>
              </nav>
            </div>
          </div>
        )}
      </header>
      
      <div className="p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center py-6">
          <p className="text-gray-400 text-lg">Digital Alarm & Health Monitoring System</p>
        </div>

        {/* Timer Section */}
        <div id="alarm" className="bg-gray-900 border-4 border-red-600 rounded-lg p-8 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-red-500" />
            <h2 className="text-2xl font-bold text-red-500">Temperature & Hydration Check</h2>
          </div>
          
          <div className="my-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div 
                className={`w-6 h-6 rounded-full ${
                  alarmStatus === 'active' ? 'bg-green-500' : 'bg-red-500 animate-pulse'
                } shadow-lg`}
              />
              <span className="text-gray-400 text-sm font-medium">
                {alarmStatus === 'active' ? 'System Active' : 'CHECK REQUIRED!'}
              </span>
            </div>
            
            <div className="text-8xl font-bold mb-4 font-mono tracking-wider">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-gray-400 text-xl mb-6">
              {alarmStatus === 'active' ? 'Next Check In' : 'TIME TO CHECK NOW!'}
            </p>
          </div>
          
          {alarmStatus === 'alert' && (
            <div className="bg-red-900 border-2 border-red-500 rounded-lg p-4 mb-6 animate-pulse">
              <AlertCircle className="w-8 h-8 text-red-300 mx-auto mb-2" />
              <p className="text-red-200 font-bold text-xl">
                ⚠️ IMMEDIATE ACTION REQUIRED!
              </p>
              <p className="text-red-300 text-base mt-2">
                Check your temperature, rest, drink water, and look for new injuries
              </p>
            </div>
          )}
          
          <button
            onClick={acknowledgeAlarm}
            disabled={alarmStatus === 'active'}
            className={`w-full py-5 px-8 rounded-lg font-bold text-2xl transition-all ${
              alarmStatus === 'active'
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {alarmStatus === 'active' ? 'Timer Active' : 'Acknowledge Check-In ✓'}
          </button>
        </div>

        {/* Injury Log Form */}
        <div id="log" className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
          <h2 className="text-3xl font-bold text-yellow-500 mb-4 flex items-center gap-2">
            <AlertCircle className="w-7 h-7" />
            Log New Injury/Check-Up
          </h2>
          
          {showSuccessMessage && (
            <div className="bg-green-900 border-2 border-green-500 rounded-lg p-4 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-200 font-medium">Injury logged successfully! Check history below.</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="location-input" className="block text-gray-300 font-medium mb-2 text-lg">
                Location/Area Checked
              </label>
              <input
                id="location-input"
                type="text"
                value={injuryLocation}
                onChange={(e) => setInjuryLocation(e.target.value)}
                placeholder="e.g., Left knee, Right ankle, Fingers, Mouth"
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
            
            <div>
              <label htmlFor="notes-input" className="block text-gray-300 font-medium mb-2 text-lg">
                Detailed Notes (Redness, Swelling, etc.)
              </label>
              <textarea
                id="notes-input"
                value={injuryNotes}
                onChange={(e) => setInjuryNotes(e.target.value)}
                placeholder="Describe any redness, swelling, unusual appearance, warmth, discharge, or temperature differences..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white text-lg placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              />
            </div>
            
            <button
              onClick={handleInjurySubmit}
              className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-xl rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Save className="w-6 h-6" />
              Log & Analyze
            </button>
          </div>
        </div>

        {/* AI Therapist Section */}
        <div id="ai" className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-purple-500 mb-4">🧠 AI Health Assistant</h2>
          
          <div className="bg-red-950 border-3 border-red-600 rounded-lg p-5 mb-6">
            <p className="text-yellow-300 text-base font-bold flex items-start gap-2">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <span>
                🧠 AI Suggestions Only: Do not treat AI advice as medical fact. 
                Always consult a physician for urgent concerns.
              </span>
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="ai-prompt" className="block text-gray-300 font-medium mb-2">
                Ask a Health-Related Question
              </label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., What should I do if I notice swelling? How often should I check my joints?"
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            
            <button
              onClick={handleAISubmit}
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Get AI Suggestion
            </button>
            
            {aiResponse && (
              <div className="bg-gray-800 border border-purple-600 rounded-lg p-4 mt-4">
                <p className="text-gray-300 leading-relaxed">{aiResponse}</p>
              </div>
            )}
          </div>
        </div>

        {/* Injury History Section */}
        <div id="history" className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
          <h2 className="text-3xl font-bold text-blue-400 mb-6 flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            Injury History & Healing Suggestions
          </h2>
          
          {injuryHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No injury logs yet. Log your first check-up above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {injuryHistory.map((injury) => (
                <div 
                  key={injury.id} 
                  className="bg-gray-800 border-2 border-gray-600 rounded-lg p-5 hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatDate(injury.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => deleteInjury(injury.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-xl font-bold text-yellow-400">{injury.location}</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed ml-7">{injury.notes}</p>
                  </div>
                  
                  <div className="bg-blue-950 border-l-4 border-blue-500 rounded p-4 mt-4">
                    <p className="text-sm text-blue-200 leading-relaxed">
                      {getHealingSuggestion(injury.location, injury.notes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div id="knowledge" className="text-center py-8 border-t-2 border-gray-800">
          <p className="text-gray-400 mb-4 text-lg">Need comprehensive information about CIPA?</p>
          <a
            href="knowledge.html"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg transition-all shadow-lg"
          >
            📚 Visit CIPA Knowledge Center
          </a>
          <div className="mt-6 text-gray-500 text-sm">
            <p>Links to knowledge.html - Create a separate HTML file with comprehensive CIPA educational content</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}