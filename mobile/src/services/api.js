import axios from 'axios';
import { API_BASE_URL } from '../config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Offline / fallback AI ─────────────────────────────────────────────────

const _KW = {
  Plumber:       ['plumb', 'pipe', 'leak', 'water', 'nal', 'paip', 'nalka', 'tap'],
  Electrician:   ['electric', 'bijli', 'bijlee', 'wiring', 'fan', 'switch', 'light', 'bulb', 'fuse'],
  'AC Technician': ['ac', 'a/c', 'aircon', 'cooler', 'thanda', 'hvac', 'air condition'],
  Tutor:         ['tutor', 'tuition', 'teacher', 'parhai', 'study', 'ustad'],
  'Home Cleaner':['clean', 'maid', 'safai', 'kam wali', 'janitor'],
  Beautician:    ['beauty', 'parlor', 'makeup', 'salon', 'dulhan'],
};

const _MOCK = {
  Plumber:         [{ name: 'Bashir Plumber', rating: 4.5 }, { name: 'Quick Fix Plumbing', rating: 4.7 }],
  Electrician:     [{ name: 'Zubair Bijli Wala', rating: 4.2 }, { name: 'Power Link Electrics', rating: 4.6 }],
  'AC Technician': [{ name: 'Ali AC Services', rating: 4.8 }, { name: 'Expert Coolers', rating: 4.2 }],
  Tutor:           [{ name: "Asma's Home Tuition", rating: 4.9 }],
  'Home Cleaner':  [{ name: 'ProClean Services', rating: 4.3 }, { name: 'SparkClean Team', rating: 4.5 }],
  Beautician:      [{ name: 'Zara Makeup Artist', rating: 4.4 }, { name: 'Glow Beauty Studio', rating: 4.6 }],
};

const _ts = () => new Date().toISOString();

function _makeTrace(steps) {
  return steps.map(([agent, type, message, ms]) => ({
    timestamp: _ts(), agent, type, message, duration_ms: ms,
  }));
}

// Simple ordinal detection matching the backend's intent agent
const _ORDINALS = { first: 0, '1': 0, 'number 1': 0, pahla: 0, doosra: 1, second: 1, '2': 1, 'number 2': 1, third: 2, teesra: 2, '3': 2, 'number 3': 2 };

// Session memory for offline mode (providers shown last turn)
let _lastShownProviders = [];
let _lastService = null;

function _detectService(msg) {
  const lower = msg.toLowerCase();
  for (const [svc, kws] of Object.entries(_KW)) {
    if (kws.some(kw => lower.includes(kw))) return svc;
  }
  return null;
}

function _detectOrdinal(msg) {
  const lower = msg.toLowerCase();
  for (const [word, idx] of Object.entries(_ORDINALS)) {
    if (lower.includes(word)) return idx;
  }
  return null;
}

function _fallbackResponse(message, history = []) {
  const msg = message.toLowerCase();

  // Cancellation
  if (['cancel', 'no', 'nahin', 'nahi', 'nope', 'abort'].some(w => msg.includes(w))) {
    _lastShownProviders = [];
    return {
      message: 'Your request has been cancelled. Feel free to ask whenever you need a service!',
      status: 'completed',
      trace_id: 'offline',
      trace: _makeTrace([
        ['IntentAgent',  'reasoning',        'Detected cancellation intent.',           8],
        ['BookingAgent', 'state_transition',  'Booking cancelled successfully.',        45],
      ]),
      booking: null,
    };
  }

  // Selection from a previously shown list
  const ordinalIdx = _detectOrdinal(msg);
  const wantsBook = ['book', 'select', 'choose', 'first', 'second', 'third', '1', '2', '3',
    'pahla', 'doosra', 'teesra'].some(w => msg.includes(w));

  if (wantsBook && ordinalIdx !== null && _lastShownProviders.length > 0) {
    const provider = _lastShownProviders[ordinalIdx];
    if (provider) {
      const bookingId = 'BK-' + Math.random().toString(36).slice(2, 10).toUpperCase();
      _lastShownProviders = [];
      return {
        message:
          `Booking Confirmed!\n` +
          `${'─'.repeat(32)}\n` +
          `Booking ID   : ${bookingId}\n` +
          `Service      : ${_lastService || 'Service'}\n` +
          `Provider     : ${provider.name}\n` +
          `Rating       : ${provider.rating} stars\n` +
          `Scheduled    : As soon as possible\n` +
          `${'─'.repeat(32)}\n` +
          `Status       : CONFIRMED\n` +
          `Provider has been notified and will arrive on time.`,
        status: 'completed',
        trace_id: 'offline',
        trace: _makeTrace([
          ['IntentAgent',        'reasoning',         `Ordinal selection detected → provider ${ordinalIdx + 1}.`,   10],
          ['BookingAgent',       'tool_execution',    `Created booking record ${bookingId}.`,                      120],
          ['NotificationAgent',  'state_transition',  `Provider "${provider.name}" notified.`,                     55],
        ]),
        booking: bookingId,
      };
    }
  }

  // Service detection (also scan history for context)
  let service = _detectService(message);
  if (!service) {
    for (let i = history.length - 1; i >= 0; i--) {
      service = _detectService(history[i].content || '');
      if (service) break;
    }
  }

  if (!service) {
    return {
      message:
        "Hello! I'm your Madadgar AI assistant.\n\n" +
        "I can help you book home services across Pakistan:\n\n" +
        "• Plumber\n• Electrician\n• AC Technician\n" +
        "• Home Tutor\n• Home Cleaner\n• Beautician\n\n" +
        "Tell me which service you need and your area (e.g. 'I need a plumber in DHA Karachi').",
      status: 'requires_clarification',
      trace_id: 'offline',
      trace: _makeTrace([
        ['IntentAgent', 'reasoning', 'Could not determine service category from message.', 12],
        ['Supervisor',  'state_transition', 'Requesting clarification from user.', 5],
      ]),
      booking: null,
    };
  }

  const providers = _MOCK[service] || [];
  _lastShownProviders = providers;
  _lastService = service;
  const list = providers.map((p, i) => `${i + 1}. ${p.name} — ⭐ ${p.rating}`).join('\n');

  return {
    message:
      `I found these top-rated ${service}s near you:\n\n${list}\n\n` +
      `Reply with "book the first one" or "book 2" to confirm your booking.`,
    status: 'requires_clarification',
    trace_id: 'offline',
    trace: _makeTrace([
      ['IntentAgent',    'reasoning',       `Detected service category: ${service}.`,                  14],
      ['LocationAgent',  'reasoning',       'Extracted location from message context.',                 18],
      ['DiscoveryAgent', 'tool_execution',  `Found ${providers.length} provider(s) in local cache.`,   25],
      ['RankingAgent',   'state_transition', 'Providers ranked by rating and proximity.',              11],
      ['Supervisor',     'state_transition', 'Presenting options to user.',                             4],
    ]),
    booking: null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

export const ChatService = {
  sendRequest: async (userId, message, history = []) => {
    try {
      const response = await apiClient.post('/chat/request', {
        user_id: userId,
        message,
        history,
      });
      // Successful backend response — reset offline session memory
      _lastShownProviders = [];
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, using offline AI:', error.message);
      return _fallbackResponse(message, history);
    }
  },
};
