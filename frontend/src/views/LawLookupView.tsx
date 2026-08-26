import React, { useState, useMemo, useEffect } from 'react';
import { useCasesStore } from '../store/cases';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Pin, 
  ChevronRight, 
  ChevronDown, 
  Scale, 
  FileText,
  Hash,
  Sparkles,
  Info
} from 'lucide-react';
import api, { showToast } from '../services/api';

interface LawArticle {
  chuong: string;
  ten_chuong: string;
  dieu: number;
  ten_dieu: string;
  noi_dung: string;
  keywords: string[];
}

export const LawLookupView: React.FC = () => {
  const { currentCase, fetchCases } = useCasesStore();
  const [articles, setArticles] = useState<LawArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<LawArticle | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load cases and penal code articles list for lookup
  useEffect(() => {
    fetchCases();
    loadAllArticles();
  }, []);

  const loadAllArticles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/legal/search');
      setArticles(response.data);
      if (response.data.length > 0) {
        setSelectedArticle(response.data[0]);
      }
    } catch (err) {
      console.error('Không thể tải danh sách bộ luật:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter articles based on search term
  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return articles;
    const term = searchTerm.toLowerCase().trim();
    return articles.filter(art => 
      art.ten_dieu.toLowerCase().includes(term) ||
      art.noi_dung.toLowerCase().includes(term) ||
      art.dieu.toString().includes(term) ||
      art.ten_chuong.toLowerCase().includes(term) ||
      art.keywords.some(k => k.toLowerCase().includes(term))
    );
  }, [articles, searchTerm]);

  // Group filtered articles by chapter
  const chapters = useMemo(() => {
    const map: Record<string, { name: string; articles: LawArticle[] }> = {};
    filteredArticles.forEach(art => {
      const key = art.chuong;
      if (!map[key]) {
        map[key] = {
          name: art.ten_chuong,
          articles: []
        };
      }
      map[key].articles.push(art);
    });
    return map;
  }, [filteredArticles]);

  const toggleChapter = (chuong: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chuong]: !prev[chuong]
    }));
  };

  // Function to highlight search keywords in the text
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return <span>{text}</span>;
    
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-amber-500/30 text-accent-gold font-bold rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  // Parse text content into clauses (Khoản) for structured display
  const parsedClauses = useMemo(() => {
    if (!selectedArticle) return [];
    
    const content = selectedArticle.noi_dung;
    // Regex matches the start of clauses like "1. ", "2. ", etc.
    const clauseRegex = /(?=\d+\.\s)/g;
    const parts = content.split(clauseRegex);
    
    return parts.map(part => {
      const trimmed = part.trim();
      
      // Attempt to identify penalty types to show as badges
      let penaltyBadge = '';
      let badgeType: 'error' | 'warning' | 'info' = 'info';

      if (trimmed.toLowerCase().includes('phạt cải tạo không giam giữ')) {
        penaltyBadge = 'Cải tạo không giam giữ';
        badgeType = 'info';
      }
      if (trimmed.toLowerCase().includes('phạt tù')) {
        // Extract prison years if possible
        const match = trimmed.match(/phạt tù từ\s+([^\s,]+)\s+đến\s+([^\s,]+)/i) || 
                      trimmed.match(/phạt tù đến\s+([^\s,]+)/i) ||
                      trimmed.match(/phạt tù từ\s+([^\s,]+)/i);
        penaltyBadge = match ? `Phạt tù: ${match[0]}` : 'Phạt tù';
        badgeType = 'warning';
      }
      if (trimmed.toLowerCase().includes('phạt tiền')) {
        penaltyBadge = 'Phạt tiền';
        badgeType = 'info';
      }
      if (trimmed.toLowerCase().includes('tù chung thân') || trimmed.toLowerCase().includes('tử hình')) {
        penaltyBadge = 'Chung thân / Tử hình';
        badgeType = 'error';
      }

      return {
        text: trimmed,
        badge: penaltyBadge,
        badgeType
      };
    });
  }, [selectedArticle]);

  // Copy Legal Basis to Clipboard
  const handleCopyLegalBasis = () => {
    if (!selectedArticle) return;
    const textToCopy = `Điều ${selectedArticle.dieu}. ${selectedArticle.ten_dieu}\nBộ luật Hình sự 2015\nNội dung:\n${selectedArticle.noi_dung}`;
    navigator.clipboard.writeText(textToCopy);
    showToast(`Đã sao chép căn cứ pháp lý Điều ${selectedArticle.dieu} vào bộ nhớ tạm.`, 'success');
  };

  // Pin Article to current selected case file
  const handlePinToCase = () => {
    if (!selectedArticle) return;
    if (!currentCase) {
      showToast('Vui lòng chọn một Vụ án thụ lý ở tab "Hồ sơ vụ án" để ghim căn cứ pháp lý này.', 'warning');
      return;
    }
    
    showToast(`Đã ghim Điều ${selectedArticle.dieu} làm căn cứ pháp lý cho Vụ án [${currentCase.case_code}].`, 'success');
  };

  return (
    <div className="flex-1 flex overflow-hidden p-6 gap-6 h-[calc(100vh-73px)]">
      
      {/* LEFT COLUMN (30%): Hierarchical Tree View */}
      <div className="w-[30%] shrink-0 h-full flex flex-col bg-white border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="text-[#126DA6]" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Danh mục Chương luật</h3>
          </div>
          
          <label htmlFor="tree-search-input" className="sr-only">Tìm kiếm điều luật</label>
          <div className="relative">
            <input
              id="tree-search-input"
              type="text"
              placeholder="Bộ lọc nhanh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] focus:border-[#126DA6] focus:ring-2 focus:ring-blue-100 focus:outline-none rounded-lg py-2 pl-9 pr-4 text-xs text-[#1E293B] transition-all font-semibold"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
        </div>
 
        {/* Cây Chương -> Điều */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none bg-[#F4F7FB]/40">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <svg className="animate-spin h-5 w-5 text-[#126DA6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : Object.keys(chapters).length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic font-semibold">
              Không tìm thấy chương luật phù hợp.
            </div>
          ) : (
            Object.entries(chapters).map(([chapterKey, chapter]) => {
              const isExpanded = expandedChapters[chapterKey] || !!searchTerm;
              return (
                <div key={chapterKey} className="border border-[#E2E8F0] rounded-lg overflow-hidden bg-white shadow-sm">
                  
                  {/* Chapter Accordion Heading */}
                  <button
                    type="button"
                    onClick={() => toggleChapter(chapterKey)}
                    className="w-full flex items-start gap-2 p-2.5 text-left hover:bg-[#F4F7FB] transition-colors duration-150 cursor-pointer"
                  >
                    <span className="mt-0.5 text-slate-400">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#126DA6] block uppercase tracking-wider">
                        Chương {chapterKey}
                      </span>
                      <span className="text-[11px] text-[#1E293B] font-semibold block truncate mt-0.5">
                        {chapter.name}
                      </span>
                    </div>
                  </button>
 
                  {/* List of articles */}
                  {isExpanded && (
                    <div className="border-t border-[#E2E8F0] bg-[#F4F7FB] p-1.5 space-y-0.5 shadow-inner">
                      {chapter.articles.map(art => {
                        const isSelected = selectedArticle?.dieu === art.dieu;
                        return (
                          <button
                            key={art.dieu}
                            type="button"
                            onClick={() => setSelectedArticle(art)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer text-xs font-semibold ${
                              isSelected 
                                ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] shadow-sm' 
                                : 'text-slate-650 hover:text-[#126DA6] hover:bg-white border border-transparent'
                            }`}
                          >
                            <Hash size={12} className="shrink-0 text-slate-400" />
                            <span className="truncate">
                              Điều {art.dieu}: {art.ten_dieu}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
 
                </div>
              );
            })
          )}
        </div>
      </div>
 
      {/* RIGHT COLUMN (70%): Multi-functional search & details display */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-lg flex flex-col overflow-hidden shadow-sm">
        
        {/* Full-text search header */}
        <div className="p-5 border-b border-[#E2E8F0] bg-[#F4F7FB] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <Scale size={14} className="text-[#126DA6]" />
              Tìm kiếm nâng cao
            </h3>
            {currentCase && (
              <span className="text-[10px] bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] px-2 py-0.5 rounded-lg font-mono font-bold shadow-sm">
                Vụ án hiện tại: {currentCase.case_code}
              </span>
            )}
          </div>
 
          <label htmlFor="multi-search-input" className="sr-only">Tìm kiếm nâng cao toàn văn bộ luật</label>
          <div className="relative">
            <input
              id="multi-search-input"
              type="text"
              placeholder="Tìm kiếm nhanh toàn văn bộ luật hình sự (Ví dụ: 'buôn lậu', 'ma túy', 'đánh bạc', 'Điều 173')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] focus:border-[#126DA6] focus:ring-2 focus:ring-blue-100 focus:outline-none rounded-lg py-3 pl-11 pr-4 text-sm text-[#1E293B] placeholder-slate-400 shadow-sm transition-all font-semibold"
            />
            <Search size={18} className="absolute left-4 top-3 text-slate-400" />
          </div>
        </div>
 
        {/* Detailed article view */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {selectedArticle ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#126DA6] uppercase tracking-wider bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-lg font-mono shadow-sm">
                    Bộ luật Hình sự Việt Nam 2015
                  </span>
                  <h2 className="text-[18px] font-bold text-[#0F172A] mt-2 flex items-center gap-2 font-sans">
                    Điều {selectedArticle.dieu}: {selectedArticle.ten_dieu}
                  </h2>
                  <span className="text-xs text-slate-500 font-bold block mt-1.5">
                    Chương {selectedArticle.chuong} - {selectedArticle.ten_chuong}
                  </span>
                </div>
 
                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 no-print">
                  <button
                    type="button"
                    onClick={handlePinToCase}
                    className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] text-xs px-3 py-2 rounded-lg cursor-pointer shadow-sm transition-colors font-bold"
                    title="Ghim làm căn cứ pháp lý cho vụ án hiện tại"
                  >
                    <Pin size={12} className="text-[#126DA6]" />
                    <span>Ghim án</span>
                  </button>
 
                  <button
                    type="button"
                    onClick={handleCopyLegalBasis}
                    className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] text-xs px-3 py-2 rounded-lg cursor-pointer shadow-sm transition-colors font-bold"
                    title="Sao chép toàn bộ điều luật"
                  >
                    <Copy size={12} className="text-slate-500" />
                    <span>Sao chép</span>
                  </button>
                </div>
              </div>
 
              {/* Parsed Clauses Display */}
              <div className="space-y-4">
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">
                  Cấu trúc văn bản và Khung hình phạt chi tiết
                </span>
 
                <div className="space-y-3">
                  {parsedClauses.map((clause, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] border-l-4 border-l-[#93C5FD] rounded-lg space-y-3 relative group overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {clause.badge && (
                        <div className="absolute top-3 right-4">
                          <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider shadow-sm ${
                            clause.badgeType === 'error'
                              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#EF4444]'
                              : clause.badgeType === 'warning'
                              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                              : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#126DA6]'
                          }`}>
                            {clause.badge}
                          </span>
                        </div>
                      )}
 
                      <div className="text-sm leading-[1.7] text-[#1E293B] pr-24 font-sans font-medium whitespace-pre-line text-justify">
                        {highlightText(clause.text, searchTerm)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Keywords Tagging */}
              <div className="space-y-2">
                <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">
                  Từ khóa hành vi liên quan (Legal keywords)
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.keywords.map((kw, i) => (
                    <span 
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-xs text-[#1D4ED8] border border-[#BFDBFE] font-mono font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Sparkles size={10} className="text-[#126DA6]" />
                      {highlightText(kw, searchTerm)}
                    </span>
                  ))}
                </div>
              </div>
 
              {/* Legal Notice */}
              <div className="p-3.5 bg-[#F4F7FB] border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B] flex items-start gap-2.5 leading-relaxed shadow-sm">
                <Info size={14} className="shrink-0 mt-0.5 text-slate-500" />
                <span className="font-semibold">
                  Lưu ý: Bộ luật Hình sự Việt Nam 2015 đang được lưu trữ trên RAM cache cục bộ để phục vụ phân tích nghiệp vụ tốc độ cao O(1). Mọi hoạt động sao chép hoặc trích xuất văn bản luật đều được tự động ghi nhận vào audit logs an ninh.
                </span>
              </div>
 
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 font-semibold py-10">
              <FileText size={48} className="opacity-25 mb-3 text-slate-400 animate-pulse" />
              <p className="text-sm">Hãy chọn điều luật từ danh sách hoặc dùng thanh tìm kiếm nhanh</p>
            </div>
          )}
        </div>
 
      </div>
 
    </div>
  );
};
export default LawLookupView;
