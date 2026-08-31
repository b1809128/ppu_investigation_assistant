import { create } from 'zustand';
import api from '../services/api';

export interface CaseFile {
  id: number;
  case_code: string;
  case_number?: string; // Backwards compatibility alias
  case_name: string;
  title?: string; // Backwards compatibility alias
  incident_date: string | null;
  location: string | null;
  summary_acts: string | null;
  description?: string | null; // Backwards compatibility alias
  damage_value: number | null;
  status: 'INVESTIGATING' | 'SUSPENDED' | 'CLOSED';
  investigation_stage?: string;
  lead_investigator_id: number;
  created_at: string;
  updated_at: string;
}

export interface Suspect {
  id: number;
  case_id: number;
  case_file_id?: number; // Backwards compatibility alias
  full_name: string;
  dob: string | null;
  date_of_birth?: string | null; // Backwards compatibility alias
  identity_card: string | null;
  prior_convictions: string | null; // Database maps to prior_convictions
  address?: string | null; // Backwards compatibility alias (ui labels it as address)
  role_in_case: 'SUSPECT' | 'WITNESS' | 'VICTIM' | 'OTHER';
  created_at: string;
  updated_at: string;
}

interface RecidivismEval {
  has_warning: boolean;
  level: string;
  message: string;
  guideline: string;
}

interface ArticleSuggestion {
  article_id: number;
  title: string;
  applicable_clause: number;
  severity: string;
  clause_details: string;
  damage_warning: string | null;
  suspect_is_liable: boolean;
  liability_note: string;
}

export interface SuspectEvaluation {
  suspect_id: number;
  full_name: string;
  dob: string | null;
  age: number | null;
  age_status: string;
  age_details: string;
  recidivism: RecidivismEval;
  article_suggestions: ArticleSuggestion[];
}

export interface CaseEvaluation {
  id: number;
  case_id: number;
  case_code: string;
  case_name: string;
  incident_date: string | null;
  location: string | null;
  damage_value: number | null;
  summary_acts: string | null;
  matched_articles_count: number;
  matched_articles: any[];
  suspects_count: number;
  evaluations: SuspectEvaluation[];
}

interface CasesState {
  cases: CaseFile[];
  currentCase: CaseFile | null;
  currentSuspects: Suspect[];
  currentEvaluation: CaseEvaluation | null;
  isLoading: boolean;
  error: string | null;
  
  fetchCases: () => Promise<void>;
  fetchCaseById: (id: number) => Promise<CaseFile>;
  createCase: (caseData: Partial<CaseFile>) => Promise<CaseFile>;
  updateCase: (id: number, caseData: Partial<CaseFile>) => Promise<CaseFile>;
  deleteCase: (id: number) => Promise<void>;
  
  fetchSuspects: (caseId: number) => Promise<void>;
  addSuspect: (caseId: number, suspectData: Partial<Suspect>) => Promise<Suspect>;
  updateSuspect: (caseId: number, suspectId: number, suspectData: Partial<Suspect>) => Promise<Suspect>;
  removeSuspect: (caseId: number, suspectId: number) => Promise<void>;
  
  evaluateCase: (caseId: number, manualKeywords?: string) => Promise<void>;
}

export const useCasesStore = create<CasesState>((set) => ({
  cases: [],
  currentCase: null,
  currentSuspects: [],
  currentEvaluation: null,
  isLoading: false,
  error: null,

  fetchCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/cases');
      set({ cases: response.data, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể tải danh sách vụ án.', 
        isLoading: false 
      });
    }
  },

  fetchCaseById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/cases/${id}`);
      set({ currentCase: response.data, isLoading: false });
      return response.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || `Không thể tải vụ án ID ${id}`, 
        isLoading: false 
      });
      throw err;
    }
  },

  createCase: async (caseData: Partial<CaseFile>) => {
    set({ isLoading: true, error: null });
    try {
      // Map frontend fields (e.g. description to summary_acts, case_number to case_code) if needed by backend schema
      const payload = {
        case_code: caseData.case_code || caseData.case_number,
        case_name: caseData.case_name || caseData.title,
        incident_date: caseData.incident_date,
        location: caseData.location,
        summary_acts: caseData.summary_acts || caseData.description,
        damage_value: caseData.damage_value,
        status: caseData.status || 'INVESTIGATING',
        investigation_stage: caseData.investigation_stage || 'XAC_MINH'
      };
      
      const response = await api.post('/api/cases', payload);
      set((state) => ({ 
        cases: [response.data, ...state.cases],
        isLoading: false 
      }));
      return response.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể tạo hồ sơ vụ án.', 
        isLoading: false 
      });
      throw err;
    }
  },

  updateCase: async (id: number, caseData: Partial<CaseFile>) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        case_name: caseData.case_name || caseData.title,
        incident_date: caseData.incident_date,
        location: caseData.location,
        summary_acts: caseData.summary_acts || caseData.description,
        damage_value: caseData.damage_value,
        status: caseData.status,
        investigation_stage: caseData.investigation_stage
      };
      
      const response = await api.put(`/api/cases/${id}`, payload);
      set((state) => ({
        cases: state.cases.map((c) => (c.id === id ? response.data : c)),
        currentCase: state.currentCase?.id === id ? response.data : state.currentCase,
        isLoading: false
      }));
      return response.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể cập nhật hồ sơ vụ án.', 
        isLoading: false 
      });
      throw err;
    }
  },

  deleteCase: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/cases/${id}`);
      set((state) => ({
        cases: state.cases.filter((c) => c.id !== id),
        currentCase: state.currentCase?.id === id ? null : state.currentCase,
        isLoading: false
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể xóa hồ sơ vụ án.', 
        isLoading: false 
      });
      throw err;
    }
  },

  fetchSuspects: async (caseId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/cases/${caseId}/suspects`);
      set({ currentSuspects: response.data, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể tải danh sách đối tượng.', 
        isLoading: false 
      });
    }
  },

  addSuspect: async (caseId: number, suspectData: Partial<Suspect>) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        full_name: suspectData.full_name,
        dob: suspectData.dob || suspectData.date_of_birth,
        identity_card: suspectData.identity_card,
        prior_convictions: suspectData.prior_convictions || suspectData.address,
        role_in_case: suspectData.role_in_case || 'SUSPECT'
      };
      
      const response = await api.post(`/api/cases/${caseId}/suspects`, payload);
      set((state) => ({
        currentSuspects: [...state.currentSuspects, response.data],
        isLoading: false
      }));
      return response.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể thêm đối tượng vào vụ án.', 
        isLoading: false 
      });
      throw err;
    }
  },

  updateSuspect: async (caseId: number, suspectId: number, suspectData: Partial<Suspect>) => {
    set({ isLoading: true, error: null });
    try {
      const payload = {
        full_name: suspectData.full_name,
        dob: suspectData.dob || suspectData.date_of_birth,
        identity_card: suspectData.identity_card,
        prior_convictions: suspectData.prior_convictions || suspectData.address,
        role_in_case: suspectData.role_in_case
      };
      
      const response = await api.put(`/api/cases/${caseId}/suspects/${suspectId}`, payload);
      set((state) => ({
        currentSuspects: state.currentSuspects.map((s) => (s.id === suspectId ? response.data : s)),
        isLoading: false
      }));
      return response.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể cập nhật đối tượng.', 
        isLoading: false 
      });
      throw err;
    }
  },

  removeSuspect: async (caseId: number, suspectId: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/cases/${caseId}/suspects/${suspectId}`);
      set((state) => ({
        currentSuspects: state.currentSuspects.filter((s) => s.id !== suspectId),
        isLoading: false
      }));
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể xóa đối tượng khỏi vụ án.', 
        isLoading: false 
      });
      throw err;
    }
  },

  evaluateCase: async (caseId: number, manualKeywords?: string) => {
    set({ isLoading: true, error: null });
    try {
      const url = manualKeywords
        ? `/api/v1/cases/${caseId}/evaluate?manual_keywords=${encodeURIComponent(manualKeywords)}`
        : `/api/v1/cases/${caseId}/evaluate`;
      const response = await api.get(url);
      set({ currentEvaluation: response.data, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || 'Không thể chạy bộ đối chiếu luật hình sự.', 
        isLoading: false 
      });
    }
  }
}));
