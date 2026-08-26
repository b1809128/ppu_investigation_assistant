import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, ChevronDown, Search, Hash } from 'lucide-react';

interface LawArticle {
  chuong: string;
  ten_chuong: string;
  dieu: number;
  ten_dieu: string;
  noi_dung: string;
  keywords: string[];
}

interface LawTreeProps {
  articles: LawArticle[];
  onSelectArticle?: (article: LawArticle) => void;
  selectedArticleId?: number | null;
}

export const LawTree: React.FC<LawTreeProps> = ({ 
  articles, 
  onSelectArticle, 
  selectedArticleId = null 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [expandedArticles, setExpandedArticles] = useState<Record<number, boolean>>({});

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

  const toggleArticle = (dieu: number) => {
    setExpandedArticles(prev => ({
      ...prev,
      [dieu]: !prev[dieu]
    }));
  };

  return (
    <div className="flex flex-col h-full bg-navy-900 border border-slate-700/60 rounded-lg overflow-hidden shadow-lg">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-700/60 bg-navy-950/50">
        <label htmlFor="law-search-input" className="sr-only">Tìm kiếm điều luật</label>
        <div className="relative">
          <input
            id="law-search-input"
            type="text"
            placeholder="Tìm theo điều số, tên tội danh, từ khóa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-navy-900 border border-slate-700 focus:border-accent-gold rounded-lg py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors duration-150"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
        </div>
        {searchTerm && (
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Tìm thấy {filteredArticles.length} điều luật</span>
            <button 
              type="button" 
              onClick={() => setSearchTerm('')}
              className="text-accent-gold hover:underline cursor-pointer"
            >
              Xóa lọc
            </button>
          </div>
        )}
      </div>

      {/* Cây danh sách luật */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {Object.keys(chapters).length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Không tìm thấy điều luật phù hợp</p>
          </div>
        ) : (
          Object.entries(chapters).map(([chapterKey, chapter]) => {
            const isChapterExpanded = expandedChapters[chapterKey] || !!searchTerm;
            return (
              <div 
                key={chapterKey}
                className="border border-slate-800/40 rounded-lg overflow-hidden bg-navy-950/20"
              >
                {/* Chapter Heading */}
                <button
                  type="button"
                  onClick={() => toggleChapter(chapterKey)}
                  className="w-full flex items-start gap-2.5 p-3 text-left hover:bg-navy-800/40 transition-colors duration-150"
                >
                  <span className="mt-0.5 text-slate-400">
                    {isChapterExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-accent-gold block uppercase tracking-wider">
                      Chương {chapterKey}
                    </span>
                    <span className="text-xs text-slate-300 font-medium line-clamp-2 mt-0.5">
                      {chapter.name}
                    </span>
                  </div>
                </button>

                {/* Articles inside Chapter */}
                {isChapterExpanded && (
                  <div className="border-t border-slate-800/50 bg-navy-900/50 px-2 py-1 space-y-1">
                    {chapter.articles.map(art => {
                      const isSelected = selectedArticleId === art.dieu;
                      const isArtExpanded = expandedArticles[art.dieu] || isSelected;

                      return (
                        <div 
                          key={art.dieu}
                          className={`rounded-lg overflow-hidden border ${
                            isSelected 
                              ? 'border-accent-gold/40 bg-accent-gold/5' 
                              : 'border-transparent hover:border-slate-800 hover:bg-navy-800/30'
                          }`}
                        >
                          {/* Article Title */}
                          <div className="flex items-center justify-between p-2">
                            <button
                              type="button"
                              onClick={() => {
                                toggleArticle(art.dieu);
                                if (onSelectArticle) onSelectArticle(art);
                              }}
                              className="flex-1 flex items-start gap-2 text-left"
                            >
                              <Hash size={14} className="mt-1 text-slate-500 shrink-0" />
                              <div>
                                <span className="text-xs font-semibold text-slate-200">
                                  Điều {art.dieu}
                                </span>
                                <span className="text-xs text-slate-300 ml-1 font-medium">
                                  - {art.ten_dieu}
                                </span>
                              </div>
                            </button>
                          </div>

                          {/* Article Content & Keywords */}
                          {isArtExpanded && (
                            <div className="px-4 pb-3 pt-1 text-xs text-slate-400 border-t border-slate-800/40 bg-navy-950/20">
                              <p className="leading-relaxed whitespace-pre-line text-slate-300">
                                {art.noi_dung}
                              </p>
                              
                              {/* Keywords */}
                              <div className="mt-3 flex flex-wrap gap-1">
                                {art.keywords.map((kw, i) => (
                                  <span 
                                    key={i}
                                    className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700/50"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
  );
};
