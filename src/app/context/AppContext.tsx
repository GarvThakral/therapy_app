import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { isSameMonth } from 'date-fns';

import {
  ApiError,
  type ApiHomeworkItem,
  type ApiLogEntry,
  type ApiProfile,
  type ApiSession,
  type AuthUser,
  createHomeworkApi,
  createLogApi,
  createSessionApi,
  deleteAccountApi,
  deleteLogApi,
  startProCheckoutApi,
  getHomeworkApi,
  getErrorMessage,
  getLogsApi,
  getProfileApi,
  getSessionsApi,
  type PlanType,
  loginApi,
  meApi,
  startSessionApi,
  signupApi,
  updateSessionApi,
  updateHomeworkApi,
  updateLogApi,
  updatePlanApi,
  updateProfileApi,
} from '../lib/api';

export type EntryType = 'trigger' | 'event' | 'thought' | 'win';
export type TopicTag = 'Anxiety' | 'Family' | 'Relationships' | 'Work' | 'Self-esteem' | 'Grief' | 'Identity' | 'Patterns' | 'Communication' | 'Trauma' | 'Boundaries';

export interface LogEntry {
  id: string;
  text: string;
  type: EntryType;
  intensity: number;
  timestamp: Date;
  addedToPrep: boolean;
  prepNote?: string;
  checkedOff?: boolean;
  isArchived?: boolean;
}

export interface HomeworkItem {
  id: string;
  text: string;
  sessionId: string;
  sessionDate: Date;
  dueDate?: Date;
  completed: boolean;
  completedDate?: Date;
}

export interface Session {
  id: string;
  date: Date;
  endDate: Date | null;
  number: number;
  topics: TopicTag[];
  whatStoodOut: string;
  prepItems: string[];
  homework: HomeworkItem[];
  postMood: number;
  moodWord: string;
  completed: boolean;
  isCurrent: boolean;
}

export interface UserSettings {
  displayName: string;
  therapistName: string;
  sessionFrequency: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  sessionDay: string;
  sessionTime: string;
  nextSessionDate: Date;
  preSessionReminder: number;
  postSessionReminder: number;
  enablePreReminder: boolean;
  enablePostReminder: boolean;
  enableHomeworkReminder: boolean;
  enableWeeklyNudge: boolean;
  theme: 'dark' | 'light' | 'system';
  fontSize: 'standard' | 'large';
  aiSuggestions: boolean;
  isPro: boolean;
  onboarded: boolean;
}

interface PlanBenefits {
  maxMonthlyEntries: number | null;
  hasPatternInsights: boolean;
  hasPdfExport: boolean;
}

interface AppState {
  entries: LogEntry[];
  archivedEntries: LogEntry[];
  sessionEntries: LogEntry[];
  sessionArchivedEntries: LogEntry[];
  sessions: Session[];
  homework: HomeworkItem[];
  sessionHomework: HomeworkItem[];
  settings: UserSettings;
  activeSessionId: string | null;
  activeSessionDate: Date;
  activeSessionEndDate: Date | null;
  weeklyMood: string | null;
  authUser: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isLogsLoading: boolean;
  plan: PlanType;
  planBenefits: PlanBenefits;
  monthlyEntryCount: number;
  addEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>, addToPrep?: boolean) => Promise<boolean>;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updates: Partial<LogEntry>) => void;
  toggleEntryPrep: (id: string) => void;
  loadArchivedEntries: () => Promise<void>;
  addHomework: (item: Omit<HomeworkItem, 'id' | 'completed' | 'completedDate'>) => void;
  toggleHomework: (id: string) => void;
  startSession: (date?: Date) => Promise<void>;
  selectSession: (sessionId: string | null) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  setWeeklyMood: (mood: string) => void;
  saveSession: (session: Omit<Session, 'id' | 'number' | 'homework'> & { homeworkItems?: Array<{ text: string; dueDate?: Date }> }) => Promise<void>;
  updateSession: (id: string, updates: Partial<Pick<Session, 'date' | 'topics' | 'whatStoodOut' | 'prepItems' | 'postMood' | 'moodWord' | 'completed'>>) => Promise<void>;
  signUp: (payload: { email: string; password: string; name?: string }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  completeGoogleAuth: (authToken: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  selectPlan: (plan: PlanType) => Promise<void>;
  refreshSession: () => Promise<void>;
  isDark: boolean;
}

const TOKEN_STORAGE_KEY = 'sessionly_jwt';
const USER_STORAGE_KEY = 'sessionly_user';
const DEMO_TOKEN = 'DEMO_TOKEN';

const defaultSettings: UserSettings = {
  displayName: 'Alex',
  therapistName: '',
  sessionFrequency: 'weekly',
  sessionDay: 'Thursday',
  sessionTime: '10:00',
  nextSessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  preSessionReminder: 2,
  postSessionReminder: 1,
  enablePreReminder: true,
  enablePostReminder: true,
  enableHomeworkReminder: true,
  enableWeeklyNudge: false,
  theme: 'dark',
  fontSize: 'standard',
  aiSuggestions: false,
  isPro: false,
  onboarded: true,
};

const demoUser: AuthUser = {
  id: 'demo-user',
  email: 'demo@example.com',
  name: 'Demo User',
  plan: 'PRO',
};

const now = new Date();
const demoSessionDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const demoSessions: Session[] = [
  {
    id: 'demo-session-1',
    date: demoSessionDate,
    endDate: null,
    number: 1,
    topics: ['Anxiety', 'Work'],
    whatStoodOut: 'Practiced boundary setting and identified work triggers.',
    prepItems: ['Discuss last week incident', 'Share journaling highlights'],
    homework: [],
    postMood: 6,
    moodWord: 'Lighter',
    completed: false,
    isCurrent: true,
  },
];

const demoEntries: LogEntry[] = [
  {
    id: 'demo-log-1',
    text: 'Felt anxious before Monday meeting; heartbeat elevated.',
    type: 'trigger',
    intensity: 4,
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    addedToPrep: true,
    prepNote: 'Bring up with therapist',
    checkedOff: false,
    isArchived: false,
  },
  {
    id: 'demo-log-2',
    text: 'Took a walk and breathing felt calmer afterwards.',
    type: 'event',
    intensity: 2,
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    addedToPrep: false,
    checkedOff: false,
    isArchived: false,
  },
  {
    id: 'demo-log-3',
    text: 'Win: said no to extra task at work politely.',
    type: 'win',
    intensity: 3,
    timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    addedToPrep: false,
    checkedOff: false,
    isArchived: false,
  },
];

const demoHomework: HomeworkItem[] = [
  {
    id: 'demo-hw-1',
    text: 'Write down 3 situations where I felt tense.',
    sessionId: 'demo-session-1',
    sessionDate: demoSessionDate,
    dueDate: undefined,
    completed: false,
    completedDate: undefined,
  },
];

const AppContext = createContext<AppState | null>(null);

function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

function toLogEntry(log: ApiLogEntry): LogEntry {
  return {
    id: log.id,
    text: log.text,
    type: log.type,
    intensity: log.intensity,
    timestamp: new Date(log.createdAt),
    addedToPrep: log.addedToPrep,
    prepNote: log.prepNote || undefined,
    checkedOff: log.checkedOff,
    isArchived: log.isArchived,
  };
}

function toHomeworkItem(item: ApiHomeworkItem): HomeworkItem {
  return {
    id: item.id,
    text: item.text,
    sessionId: item.sessionId || '',
    sessionDate: new Date(item.sessionDate),
    dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
    completed: item.completed,
    completedDate: item.completedDate ? new Date(item.completedDate) : undefined,
  };
}

function toSession(session: ApiSession): Session {
  return {
    id: session.id,
    date: new Date(session.date),
    endDate: session.endDate ? new Date(session.endDate) : null,
    number: session.number,
    topics: session.topics as TopicTag[],
    whatStoodOut: session.whatStoodOut,
    prepItems: session.prepItems,
    homework: [],
    postMood: session.postMood,
    moodWord: session.moodWord || '',
    completed: session.completed,
    isCurrent: session.isCurrent,
  };
}

function toSettingsFromProfile(profile: ApiProfile, prev: UserSettings): UserSettings {
  return {
    ...prev,
    displayName: profile.displayName || prev.displayName,
    therapistName: profile.therapistName || '',
    sessionFrequency: (profile.sessionFrequency as UserSettings['sessionFrequency']) || prev.sessionFrequency,
    sessionDay: profile.sessionDay || prev.sessionDay,
    sessionTime: profile.sessionTime || prev.sessionTime,
    nextSessionDate: profile.nextSessionDate ? new Date(profile.nextSessionDate) : prev.nextSessionDate,
    preSessionReminder: profile.preSessionReminder,
    postSessionReminder: profile.postSessionReminder,
    enablePreReminder: profile.enablePreReminder,
    enablePostReminder: profile.enablePostReminder,
    enableHomeworkReminder: profile.enableHomeworkReminder,
    enableWeeklyNudge: profile.enableWeeklyNudge,
    theme: (profile.theme as UserSettings['theme']) || prev.theme,
    fontSize: (profile.fontSize as UserSettings['fontSize']) || prev.fontSize,
    aiSuggestions: profile.aiSuggestions,
    onboarded: profile.onboarded,
  };
}

function toProfilePayload(settings: UserSettings): Partial<ApiProfile> {
  return {
    displayName: settings.displayName,
    therapistName: settings.therapistName || null,
    sessionFrequency: settings.sessionFrequency,
    sessionDay: settings.sessionDay,
    sessionTime: settings.sessionTime,
    nextSessionDate: settings.nextSessionDate.toISOString(),
    preSessionReminder: settings.preSessionReminder,
    postSessionReminder: settings.postSessionReminder,
    enablePreReminder: settings.enablePreReminder,
    enablePostReminder: settings.enablePostReminder,
    enableHomeworkReminder: settings.enableHomeworkReminder,
    enableWeeklyNudge: settings.enableWeeklyNudge,
    theme: settings.theme,
    fontSize: settings.fontSize,
    aiSuggestions: settings.aiSuggestions,
    onboarded: settings.onboarded,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [archivedEntries, setArchivedEntries] = useState<LogEntry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [weeklyMood, setWeeklyMoodState] = useState<string | null>('🙂');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const profileSaveTimeoutRef = useRef<number | null>(null);

  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const plan: PlanType = authUser?.plan ?? 'FREE';

  const planBenefits: PlanBenefits = useMemo(
    () =>
      plan === 'PRO'
        ? {
            maxMonthlyEntries: null,
            hasPatternInsights: true,
            hasPdfExport: true,
          }
        : {
            maxMonthlyEntries: 30,
            hasPatternInsights: false,
            hasPdfExport: false,
          },
    [plan],
  );

  const monthlyEntryCount = useMemo(() => {
    const now = new Date();
    return entries.filter(entry => isSameMonth(entry.timestamp, now)).length;
  }, [entries]);

  useEffect(() => {
    setSettings(prev => ({ ...prev, isPro: plan === 'PRO' }));
  }, [plan]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', settings.fontSize === 'large' ? '17px' : '15px');
  }, [settings.fontSize]);

  const persistAuth = useCallback((nextToken: string, user: AuthUser) => {
    setToken(nextToken);
    setAuthUser(user);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAuthUser(null);
    setEntries([]);
    setArchivedEntries([]);
    setSessions([]);
    setHomework([]);
    setSettings(defaultSettings);
    setActiveSessionId(null);
    setIsAuthLoading(false);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const loadActiveLogs = useCallback(async () => {
    if (!token || token === DEMO_TOKEN) return;

    setIsLogsLoading(true);
    try {
      const response = await getLogsApi(token, 'active');
      setEntries(response.logs.map(toLogEntry));
    } catch {
      setEntries([]);
    } finally {
      setIsLogsLoading(false);
    }
  }, [token]);

  const loadArchivedEntries = useCallback(async () => {
    if (!token || token === DEMO_TOKEN) return;

    try {
      const response = await getLogsApi(token, 'archive');
      setArchivedEntries(response.logs.map(toLogEntry));
    } catch {
      setArchivedEntries([]);
    }
  }, [token]);

  const loadSessions = useCallback(async () => {
    if (!token || token === DEMO_TOKEN) return;
    try {
      const response = await getSessionsApi(token);
      setSessions(response.sessions.map(toSession));
    } catch {
      setSessions([]);
    }
  }, [token]);

  const loadHomework = useCallback(async () => {
    if (!token || token === DEMO_TOKEN) return;
    try {
      const response = await getHomeworkApi(token);
      setHomework(response.homework.map(toHomeworkItem));
    } catch {
      setHomework([]);
    }
  }, [token]);

  const loadProfile = useCallback(async () => {
    if (!token || token === DEMO_TOKEN) return;
    try {
      const response = await getProfileApi(token);
      setSettings(prev => toSettingsFromProfile(response.profile, prev));
    } catch {
      // keep local defaults
    }
  }, [token]);

  const refreshSession = useCallback(async () => {
    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    try {
      const response = await meApi(token);
      setAuthUser(response.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    } catch {
      logout();
    } finally {
      setIsAuthLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!token || !authUser) return;
    void Promise.all([loadActiveLogs(), loadSessions(), loadHomework(), loadProfile()]);
  }, [token, authUser, loadActiveLogs, loadHomework, loadProfile, loadSessions]);

  useEffect(() => {
    if (!activeSessionId) return;
    if (!sessions.some(session => session.id === activeSessionId)) {
      setActiveSessionId(null);
    }
  }, [activeSessionId, sessions]);

  const signUp = useCallback(
    async (payload: { email: string; password: string; name?: string }) => {
      const response = await signupApi(payload);
      persistAuth(response.token, response.user);
      setSettings(prev => ({
        ...prev,
        displayName: response.user.name || prev.displayName,
      }));
    },
    [persistAuth],
  );

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const response = await loginApi(payload);
      persistAuth(response.token, response.user);
      setSettings(prev => ({
        ...prev,
        displayName: response.user.name || prev.displayName,
      }));
    },
    [persistAuth],
  );

  const completeGoogleAuth = useCallback(
    async (authToken: string) => {
      const response = await meApi(authToken);
      persistAuth(authToken, response.user);
      setSettings(prev => ({
        ...prev,
        displayName: response.user.name || prev.displayName,
      }));
    },
    [persistAuth],
  );

  const loginDemo = useCallback(() => {
    persistAuth(DEMO_TOKEN, demoUser);
    setSettings(prev => ({
      ...prev,
      displayName: demoUser.name || prev.displayName,
      isPro: true,
    }));
    setEntries(demoEntries);
    setArchivedEntries([]);
    setSessions(demoSessions);
    setHomework(demoHomework);
    setActiveSessionId(demoSessions[0]?.id ?? null);
    setWeeklyMoodState('🙂');
  }, [persistAuth]);

  const selectPlan = useCallback(
    async (nextPlan: PlanType) => {
      if (!token) {
        throw new ApiError('Please log in first.', 401);
      }
      if (token === DEMO_TOKEN) {
        const nextUser = { ...(authUser ?? demoUser), plan: nextPlan };
        setAuthUser(nextUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
        setSettings(prev => ({ ...prev, isPro: nextPlan === 'PRO' }));
        return;
      }

      if (nextPlan === 'PRO') {
        const response = await startProCheckoutApi(token);
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
          return;
        }

        if (response.user) {
          setAuthUser(response.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
          return;
        }

        throw new ApiError('Unable to start checkout right now. Please try again.', 500);
      }

      const response = await updatePlanApi(nextPlan, token);
      if (!response.user) {
        throw new ApiError('Failed to update plan. Please try again.', 500);
      }
      setAuthUser(response.user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    },
    [authUser, token],
  );

  const deleteAccount = useCallback(async () => {
    if (!token) throw new ApiError('Session expired. Please log in again.', 401);
    await deleteAccountApi(token);
    logout();
  }, [logout, token]);

  const addEntry = useCallback(
    async (entry: Omit<LogEntry, 'id' | 'timestamp'>, addToPrep?: boolean) => {
      const now = new Date();
      const maxMonthlyEntries = planBenefits.maxMonthlyEntries;

      if (!token) {
        throw new ApiError('Session expired. Please log in again.', 401);
      }
      if (token === DEMO_TOKEN) {
        const newEntry: LogEntry = {
          id: `demo-log-${Date.now()}`,
          text: entry.text,
          type: entry.type,
          intensity: entry.intensity,
          timestamp: now,
          addedToPrep: addToPrep ?? entry.addedToPrep ?? false,
          prepNote: entry.prepNote,
          checkedOff: Boolean(entry.checkedOff),
          isArchived: false,
        };
        setEntries(prev => [newEntry, ...prev]);
        return true;
      }
      if (maxMonthlyEntries !== null) {
        const countThisMonth = entries.filter(existing => isSameMonth(existing.timestamp, now)).length;
        if (countThisMonth >= maxMonthlyEntries) return false;
      }

      try {
        const response = await createLogApi(token, {
          text: entry.text,
          type: entry.type,
          intensity: entry.intensity,
          addedToPrep: addToPrep ?? entry.addedToPrep ?? false,
          prepNote: entry.prepNote,
          checkedOff: Boolean(entry.checkedOff),
        });

        setEntries(prev => [toLogEntry(response.log), ...prev]);
        return true;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(getErrorMessage(error, 'Failed to save log. Please try again.'), 500);
      }
    },
    [entries, planBenefits.maxMonthlyEntries, token],
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    setArchivedEntries(prev => prev.filter(e => e.id !== id));
    if (!token) return;
    void deleteLogApi(token, id).catch(() => {
      void loadActiveLogs();
    });
  }, [loadActiveLogs, token]);

  const updateEntry = useCallback((id: string, updates: Partial<LogEntry>) => {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
    setArchivedEntries(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
    if (!token) return;

    const payload: Record<string, unknown> = {};
    if (typeof updates.text === 'string') payload.text = updates.text;
    if (updates.type) payload.type = updates.type;
    if (typeof updates.intensity === 'number') payload.intensity = updates.intensity;
    if (typeof updates.addedToPrep === 'boolean') payload.addedToPrep = updates.addedToPrep;
    if (typeof updates.checkedOff === 'boolean') payload.checkedOff = updates.checkedOff;
    if (typeof updates.prepNote === 'string') payload.prepNote = updates.prepNote;
    if (updates.prepNote === undefined && 'prepNote' in updates) payload.prepNote = null;

    void updateLogApi(token, id, payload as any).catch(() => {
      void loadActiveLogs();
    });
  }, [loadActiveLogs, token]);

  const toggleEntryPrep = useCallback((id: string) => {
    const found = entries.find(e => e.id === id);
    if (!found) return;
    updateEntry(id, { addedToPrep: !found.addedToPrep });
  }, [entries, updateEntry]);

  const addHomework = useCallback((item: Omit<HomeworkItem, 'id' | 'completed' | 'completedDate'>) => {
    const optimistic: HomeworkItem = {
      ...item,
      id: `tmp-${Date.now()}`,
      completed: false,
    };
    setHomework(prev => [optimistic, ...prev]);

    if (!token || token === DEMO_TOKEN) return;
    void createHomeworkApi(token, {
      text: item.text,
      sessionId: item.sessionId,
      sessionDate: item.sessionDate.toISOString(),
      dueDate: item.dueDate ? item.dueDate.toISOString() : undefined,
    })
      .then(response => {
        setHomework(prev => prev.map(h => (h.id === optimistic.id ? toHomeworkItem(response.homework) : h)));
      })
      .catch(() => {
        setHomework(prev => prev.filter(h => h.id !== optimistic.id));
      });
  }, [token]);

  const toggleHomework = useCallback((id: string) => {
    const target = homework.find(h => h.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;
    setHomework(prev => prev.map(h => (h.id === id
      ? {
          ...h,
          completed: nextCompleted,
          completedDate: nextCompleted ? new Date() : undefined,
        }
      : h)));

    if (!token) return;
    void updateHomeworkApi(token, id, { completed: nextCompleted }).catch(() => {
      void loadHomework();
    });
  }, [homework, loadHomework, token]);

  const queueProfileSave = useCallback((nextSettings: UserSettings, authToken: string) => {
    if (profileSaveTimeoutRef.current) {
      window.clearTimeout(profileSaveTimeoutRef.current);
    }

    profileSaveTimeoutRef.current = window.setTimeout(() => {
      void updateProfileApi(authToken, toProfilePayload(nextSettings)).catch(() => {
        // keep local state if save fails
      });
    }, 400);
  }, []);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (token) queueProfileSave(next, token);
      return next;
    });
  }, [queueProfileSave, token]);

  const setWeeklyMood = useCallback((mood: string) => {
    setWeeklyMoodState(mood);
  }, []);

  const startSession = useCallback(async (date?: Date) => {
    if (!token) throw new ApiError('Session expired. Please log in again.', 401);

    if (token === DEMO_TOKEN) {
      const sessionDate = date ?? new Date();
      const newSession: Session = {
        id: `demo-session-${Date.now()}`,
        date: sessionDate,
        endDate: null,
        number: sessions.length > 0 ? Math.max(...sessions.map(s => s.number)) + 1 : 1,
        topics: [],
        whatStoodOut: '',
        prepItems: [],
        homework: [],
        postMood: 5,
        moodWord: '',
        completed: false,
        isCurrent: true,
      };

      setSessions(prev =>
        [
          newSession,
          ...prev.map(session =>
            session.endDate === null && session.date < sessionDate
              ? { ...session, endDate: sessionDate, isCurrent: false, completed: true }
              : { ...session, isCurrent: false },
          ),
        ],
      );
      setActiveSessionId(newSession.id);
      return;
    }

    const response = await startSessionApi(token, {
      date: (date ?? new Date()).toISOString(),
    });

    setSessions(prev => [toSession(response.session), ...prev.map(session => {
      if (!session.endDate && session.date < new Date(response.session.date)) {
        return {
          ...session,
          endDate: new Date(response.session.date),
          isCurrent: false,
          completed: true,
        };
      }
      return session;
    })]);
    setActiveSessionId(response.session.id);
  }, [token]);

  const selectSession = useCallback((sessionId: string | null) => {
    if (!sessionId) {
      setActiveSessionId(null);
      return;
    }

    const selected = sessions.find(session => session.id === sessionId);
    if (!selected) return;

    setActiveSessionId(sessionId);
  }, [sessions]);

  const saveSession = useCallback(
    async (session: Omit<Session, 'id' | 'number' | 'homework'> & { homeworkItems?: Array<{ text: string; dueDate?: Date }> }) => {
      if (!token) throw new ApiError('Session expired. Please log in again.', 401);
      const fallbackCurrentId = sessions
        .slice()
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .find(item => item.isCurrent || item.endDate === null)?.id;
      const targetSessionId = activeSessionId ?? fallbackCurrentId;

      if (token === DEMO_TOKEN) {
        const newSession: Session = {
          id: targetSessionId ?? `demo-session-${Date.now()}`,
          date: session.date,
          endDate: null,
          number: sessions.length > 0 ? Math.max(...sessions.map(s => s.number)) + 1 : 1,
          topics: session.topics,
          whatStoodOut: session.whatStoodOut,
          prepItems: session.prepItems,
          homework: [],
          postMood: session.postMood,
          moodWord: session.moodWord,
          completed: session.completed,
          isCurrent: true,
        };
        setSessions(prev => {
          const exists = prev.some(item => item.id === newSession.id);
          const updatedPrev = prev.map(item => ({
            ...item,
            isCurrent: item.id === newSession.id,
            endDate: item.id !== newSession.id && item.isCurrent ? newSession.date : item.endDate,
          }));
          return exists
            ? updatedPrev.map(item => (item.id === newSession.id ? newSession : item))
            : [newSession, ...updatedPrev];
        });
        if (session.homeworkItems?.length) {
          const mapped = session.homeworkItems.map(item => ({
            id: `demo-hw-${Date.now()}-${Math.random()}`,
            text: item.text,
            sessionId: newSession.id,
            sessionDate: newSession.date,
            dueDate: item.dueDate,
            completed: false,
            completedDate: undefined,
          }));
          setHomework(prev => [...mapped, ...prev]);
        }
        setActiveSessionId(newSession.id);
        return;
      }

      const response = await createSessionApi(token, {
        action: 'save',
        sessionId: targetSessionId ?? undefined,
        date: session.date.toISOString(),
        topics: session.topics,
        whatStoodOut: session.whatStoodOut,
        prepItems: session.prepItems,
        postMood: session.postMood,
        moodWord: session.moodWord,
        completed: session.completed,
        homeworkItems: (session.homeworkItems ?? []).map(item => ({
          text: item.text,
          dueDate: item.dueDate ? item.dueDate.toISOString() : undefined,
        })),
      });

      setSessions(prev => {
        const incoming = toSession(response.session);
        const exists = prev.some(item => item.id === incoming.id);
        if (exists) return prev.map(item => (item.id === incoming.id ? incoming : item));
        return [incoming, ...prev];
      });
      setActiveSessionId(response.session.id);
      if (response.homeworkItems.length > 0) {
        const mapped = response.homeworkItems.map(toHomeworkItem);
        setHomework(prev => [...mapped, ...prev]);
      }
    },
    [activeSessionId, sessions, token],
  );

  const updateSession = useCallback(async (
    id: string,
    updates: Partial<Pick<Session, 'date' | 'topics' | 'whatStoodOut' | 'prepItems' | 'postMood' | 'moodWord' | 'completed'>>,
  ) => {
    if (!token) throw new ApiError('Session expired. Please log in again.', 401);

    if (token === DEMO_TOKEN) {
      setSessions(prev => prev.map(session => {
        if (session.id !== id) return session;
        return {
          ...session,
          ...updates,
          date: updates.date ?? session.date,
        };
      }));
      return;
    }

    const payload: Record<string, unknown> = {};
    if (updates.date) payload.date = updates.date.toISOString();
    if (updates.topics) payload.topics = updates.topics;
    if (typeof updates.whatStoodOut === 'string') payload.whatStoodOut = updates.whatStoodOut;
    if (updates.prepItems) payload.prepItems = updates.prepItems;
    if (typeof updates.postMood === 'number') payload.postMood = updates.postMood;
    if (typeof updates.moodWord === 'string') payload.moodWord = updates.moodWord;
    if (typeof updates.completed === 'boolean') payload.completed = updates.completed;

    const response = await updateSessionApi(token, id, payload as any);
    setSessions(prev => prev.map(session => (session.id === id ? toSession(response.session) : session)));
  }, [token]);

  const resolvedActiveSession = useMemo(() => {
    if (activeSessionId) {
      const explicit = sessions.find(session => session.id === activeSessionId);
      if (explicit) return explicit;
    }

    const current = sessions.find(session => session.isCurrent || session.endDate === null);
    if (current) return current;

    return sessions
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? null;
  }, [activeSessionId, sessions]);

  const activeSessionDate = resolvedActiveSession?.date ?? settings.nextSessionDate;
  const activeSessionEndDate = resolvedActiveSession?.endDate ?? null;
  const hasResolvedSession = Boolean(resolvedActiveSession);

  const sessionEntries = useMemo(() => {
    if (!hasResolvedSession) return entries;
    return entries.filter(entry => {
      const timestamp = entry.timestamp.getTime();
      const start = activeSessionDate.getTime();
      if (timestamp < start) return false;
      if (activeSessionEndDate && timestamp >= activeSessionEndDate.getTime()) return false;
      return true;
    });
  }, [activeSessionDate, activeSessionEndDate, entries, hasResolvedSession]);

  const sessionArchivedEntries = useMemo(() => {
    if (!hasResolvedSession) return archivedEntries;
    return archivedEntries.filter(entry => {
      const timestamp = entry.timestamp.getTime();
      const start = activeSessionDate.getTime();
      if (timestamp < start) return false;
      if (activeSessionEndDate && timestamp >= activeSessionEndDate.getTime()) return false;
      return true;
    });
  }, [activeSessionDate, activeSessionEndDate, archivedEntries, hasResolvedSession]);

  const sessionHomework = useMemo(() => {
    if (!hasResolvedSession) return homework;
    return homework.filter(item => {
      const sessionDate = item.sessionDate.getTime();
      const start = activeSessionDate.getTime();
      if (sessionDate < start) return false;
      if (activeSessionEndDate && sessionDate >= activeSessionEndDate.getTime()) return false;
      return true;
    });
  }, [activeSessionDate, activeSessionEndDate, hasResolvedSession, homework]);

  return (
    <AppContext.Provider
      value={{
        entries,
        archivedEntries,
        sessionEntries,
        sessionArchivedEntries,
        sessions,
        homework,
        sessionHomework,
        settings,
        activeSessionId,
        activeSessionDate,
        activeSessionEndDate,
        weeklyMood,
        authUser,
        token,
        isAuthenticated: Boolean(token && authUser),
        isAuthLoading,
        isLogsLoading,
        plan,
        planBenefits,
        monthlyEntryCount,
        addEntry,
        deleteEntry,
        updateEntry,
        toggleEntryPrep,
        loadArchivedEntries,
        addHomework,
        toggleHomework,
        startSession,
        selectSession,
        updateSettings,
        setWeeklyMood,
        saveSession,
        updateSession,
        signUp,
        login,
        completeGoogleAuth,
        loginDemo,
        logout,
        deleteAccount,
        selectPlan,
        refreshSession,
        isDark,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
