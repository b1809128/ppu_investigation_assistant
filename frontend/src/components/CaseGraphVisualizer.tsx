import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, 
  ShieldAlert, 
  Scale, 
  Crosshair, 
  Coins, 
  Sparkles,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Link,
  Layers
} from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  type: 'SUSPECT' | 'VICTIM' | 'ACTION' | 'WEAPON' | 'DAMAGE' | 'ARTICLE';
  color: string;
  borderColor: string;
  bgLight: string;
  iconName: string;
  details?: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type?: 'primary' | 'competing' | 'normal';
}

export interface SuspectGraphItem {
  id: number | string;
  name: string;
  age?: number | null;
  isLiable?: boolean;
  recidivismLevel?: string;
  role?: string;
}

interface CaseGraphVisualizerProps {
  caseCode?: string;
  summaryActs: string;
  suspectName?: string;
  suspectAge?: number | null;
  suspectsList?: SuspectGraphItem[];
  selectedSuspectId?: number | string | null;
  weapon?: string;
  damageValue?: number | null;
  primaryArticle?: { articleId: number; title: string; clause?: string; score?: number };
  competingArticle?: { articleId: number; title: string; clause?: string; score?: number };
  distillationNote?: string;
}

export const CaseGraphVisualizer: React.FC<CaseGraphVisualizerProps> = ({
  caseCode = 'HS-2026/0101',
  summaryActs,
  suspectName = 'Nghi phạm',
  suspectAge,
  suspectsList = [],
  selectedSuspectId = null,
  weapon,
  damageValue,
  primaryArticle,
  competingArticle,
  distillationNote
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SUSPECT' | 'ACTION' | 'ARTICLE'>('ALL');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [showXAIPath, setShowXAIPath] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Zoom Control Handlers
  const handleZoomIn = () => setZoomScale(prev => Math.min(2.0, +(prev + 0.2).toFixed(1)));
  const handleZoomOut = () => setZoomScale(prev => Math.max(0.6, +(prev - 0.2).toFixed(1)));
  const handleResetZoom = () => setZoomScale(1.0);

  // Dynamic extraction of Graph Nodes & Edges from case props
  const { nodes, edges } = useMemo(() => {
    const extractedNodes: GraphNode[] = [];
    const extractedEdges: GraphEdge[] = [];

    // Compile list of suspects
    const effectiveSuspects: SuspectGraphItem[] = suspectsList.length > 0 ? suspectsList : [
      {
        id: 'node_suspect_1',
        name: suspectName || 'Đối tượng chính',
        age: suspectAge,
        isLiable: true,
        role: 'Bị can chính'
      }
    ];

    // 1. Suspect Nodes (x: 130)
    effectiveSuspects.forEach((s, idx) => {
      const suspectId = `suspect_node_${s.id}`;
      const isNotLiable = s.isLiable === false;
      const isSelected = selectedSuspectId !== null && String(selectedSuspectId) === String(s.id);

      const color = isNotLiable ? '#94A3B8' : isSelected ? '#EF4444' : idx === 0 ? '#EF4444' : '#F97316';
      const borderColor = isNotLiable ? '#64748B' : isSelected ? '#DC2626' : '#EA580C';
      const bgLight = isNotLiable ? '#F1F5F9' : '#FEF2F2';

      let sublabel = s.age ? `${s.age} tuổi` : 'Chưa rõ tuổi';
      if (isNotLiable) {
        sublabel += ' • ⛔ KHÔNG ĐỦ TNHS';
      } else if (s.recidivismLevel && s.recidivismLevel !== 'NONE') {
        sublabel += ' • 🟡 TÁI PHẠM';
      } else {
        sublabel += ' • Đủ TNHS';
      }

      extractedNodes.push({
        id: suspectId,
        label: s.name,
        sublabel,
        type: 'SUSPECT',
        color,
        borderColor,
        bgLight,
        iconName: 'User',
        details: `Đối tượng bị điều tra (${s.role || 'Bị can'}). Độ tuổi: ${s.age ? s.age + ' tuổi' : 'Chưa xác định'}. Trạng thái TNHS: ${isNotLiable ? 'Loại trừ TNHS theo Điều 12 BLHS' : 'Chịu TNHS đầy đủ'}.`,
        x: 130,
        y: 80 + idx * 110
      });
    });

    // 2. Weapon / Instrument Node (x: 130, y: 290)
    const summaryLower = (summaryActs || '').toLowerCase();
    const detectedWeapon = weapon || (
      summaryLower.includes('dao') ? 'Dao nhọn / Hung khí' :
      summaryLower.includes('súng') ? 'Súng ngắn' :
      summaryLower.includes('xe máy') ? 'Xe máy phân khối lớn' : null
    );

    let weaponId: string | null = null;
    if (detectedWeapon) {
      weaponId = 'node_weapon_1';
      extractedNodes.push({
        id: weaponId,
        label: detectedWeapon,
        sublabel: 'Phương tiện / Hung khí',
        type: 'WEAPON',
        color: '#F59E0B',
        borderColor: '#D97706',
        bgLight: '#FFFBEB',
        iconName: 'Crosshair',
        details: `Công cụ / Hung khí được sử dụng thực hiện hành vi phạm tội.`,
        x: 130,
        y: 290
      });

      effectiveSuspects.forEach((s, idx) => {
        const sId = `suspect_node_${s.id}`;
        extractedEdges.push({
          id: `edge_s_w_${s.id}`,
          source: sId,
          target: weaponId!,
          label: idx === 0 ? 'SỬ DỤNG' : 'ĐỒNG SỬ DỤNG'
        });
      });
    }

    // 3. Main Objective Action Node (x: 410, y: 130)
    const actionId = 'node_action_1';
    let actionLabel = 'Hành vi xâm phạm';
    if (summaryLower.includes('dùng vũ lực') || summaryLower.includes('khống chế')) {
      actionLabel = 'Dùng vũ lực & Đe dọa vũ lực';
    } else if (summaryLower.includes('giật')) {
      actionLabel = 'Nhanh chóng giật tài sản tẩu thoát';
    } else if (summaryLower.includes('đâm')) {
      actionLabel = 'Đâm liên tiếp vào vùng yếu hại';
    } else if (summaryLower.includes('trộm')) {
      actionLabel = 'Lén lút chiếm đoạt tài sản';
    }

    extractedNodes.push({
      id: actionId,
      label: actionLabel,
      sublabel: 'Hành vi khách quan',
      type: 'ACTION',
      color: '#3B82F6',
      borderColor: '#2563EB',
      bgLight: '#EFF6FF',
      iconName: 'ShieldAlert',
      details: summaryActs || 'Không có mô tả chi tiết hành vi',
      x: 410,
      y: 130
    });

    effectiveSuspects.forEach((s, idx) => {
      const sId = `suspect_node_${s.id}`;
      extractedEdges.push({
        id: `edge_s_a_${s.id}`,
        source: sId,
        target: actionId,
        label: idx === 0 ? 'THỰC HIỆN' : 'ĐỒNG PHẠM'
      });
    });

    if (weaponId) {
      extractedEdges.push({
        id: 'edge_w_a',
        source: weaponId,
        target: actionId,
        label: 'HỖ TRỢ'
      });
    }

    // 4. Damage / Consequence Node (x: 410, y: 290)
    let damageId: string | null = null;
    if (damageValue && damageValue > 0) {
      damageId = 'node_damage_1';
      extractedNodes.push({
        id: damageId,
        label: `${damageValue.toLocaleString('vi-VN')} VNĐ`,
        sublabel: 'Thiệt hại tài sản',
        type: 'DAMAGE',
        color: '#10B981',
        borderColor: '#059669',
        bgLight: '#ECFDF5',
        iconName: 'Coins',
        details: `Giá trị tài sản bị chiếm đoạt / xâm phạm được định giá tố tụng.`,
        x: 410,
        y: 290
      });

      extractedEdges.push({
        id: 'edge_a_d',
        source: actionId,
        target: damageId,
        label: 'CHIẾM ĐOẠT'
      });
    }

    // 5. Primary Legal Article Node (x: 690, y: 110)
    const priArticle = primaryArticle || {
      articleId: 168,
      title: 'Tội cướp tài sản',
      clause: 'Khoản 2 Điều 168 BLHS 2015',
      score: 0.92
    };

    const primaryArtId = 'node_art_primary';
    extractedNodes.push({
      id: primaryArtId,
      label: `Điều ${priArticle.articleId}: ${priArticle.title}`,
      sublabel: priArticle.clause || `Độ phù hợp: ${(priArticle.score ? priArticle.score * 100 : 92).toFixed(0)}%`,
      type: 'ARTICLE',
      color: '#1c75bb',
      borderColor: '#155a91',
      bgLight: '#EBF4FA',
      iconName: 'Scale',
      details: `Tội danh có độ tương đồng cao nhất dựa trên bóc tách cấu thành pháp lý.`,
      x: 690,
      y: 110
    });

    extractedEdges.push({
      id: 'edge_a_p',
      source: actionId,
      target: primaryArtId,
      label: 'CẤU THÀNH (CHÍNH)',
      type: 'primary'
    });

    if (damageId) {
      extractedEdges.push({
        id: 'edge_d_p',
        source: damageId,
        target: primaryArtId,
        label: 'ĐỊNH KHUNG MỨC PHẠT',
        type: 'primary'
      });
    }

    // 6. Competing Legal Article Node (x: 690, y: 290)
    if (competingArticle) {
      const compArtId = 'node_art_competing';
      extractedNodes.push({
        id: compArtId,
        label: `Điều ${competingArticle.articleId}: ${competingArticle.title}`,
        sublabel: competingArticle.clause || `Cạnh tranh: ${(competingArticle.score ? competingArticle.score * 100 : 40).toFixed(0)}%`,
        type: 'ARTICLE',
        color: '#A855F7',
        borderColor: '#9333EA',
        bgLight: '#F3E8FF',
        iconName: 'Scale',
        details: `Tội danh cạnh tranh / giao thoa cần làm rõ yếu tố cấu thành.`,
        x: 690,
        y: 290
      });

      extractedEdges.push({
        id: 'edge_a_c',
        source: actionId,
        target: compArtId,
        label: 'GIAO THOA CẠNH TRANH',
        type: 'competing'
      });
    }

    return { nodes: extractedNodes, edges: extractedEdges };
  }, [caseCode, summaryActs, suspectName, suspectAge, weapon, damageValue, primaryArticle, competingArticle, suspectsList, selectedSuspectId]);

  // Filter nodes based on active filter
  const filteredNodes = useMemo(() => {
    if (activeFilter === 'ALL') return nodes;
    if (activeFilter === 'SUSPECT') return nodes.filter(n => n.type === 'SUSPECT' || n.type === 'VICTIM');
    if (activeFilter === 'ACTION') return nodes.filter(n => n.type === 'ACTION' || n.type === 'WEAPON' || n.type === 'DAMAGE');
    if (activeFilter === 'ARTICLE') return nodes.filter(n => n.type === 'ARTICLE' || n.type === 'ACTION');
    return nodes;
  }, [nodes, activeFilter]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));
  }, [edges, activeNodeIds]);

  const renderIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'User': return <User size={16} style={{ color }} />;
      case 'ShieldAlert': return <ShieldAlert size={16} style={{ color }} />;
      case 'Crosshair': return <Crosshair size={16} style={{ color }} />;
      case 'Coins': return <Coins size={16} style={{ color }} />;
      case 'Scale': return <Scale size={16} style={{ color }} />;
      default: return <Info size={16} style={{ color }} />;
    }
  };

  // Connected edges for hovered/selected node
  const activeHoverEdges = useMemo(() => {
    if (!hoveredNode && !selectedNode) return new Set<string>();
    const targetId = hoveredNode?.id || selectedNode?.id;
    return new Set(edges.filter(e => e.source === targetId || e.target === targetId).map(e => e.id));
  }, [hoveredNode, selectedNode, edges]);

  // Connected nodes names for hover tooltip
  const connectedNodeNames = useMemo(() => {
    if (!hoveredNode) return [];
    const connectedIds = edges
      .filter(e => e.source === hoveredNode.id || e.target === hoveredNode.id)
      .map(e => e.source === hoveredNode.id ? e.target : e.source);
    return nodes.filter(n => connectedIds.includes(n.id)).map(n => n.label);
  }, [hoveredNode, edges, nodes]);

  // Core Responsive SVG & Node Renderer with viewBox="0 0 850 400"
  const renderGraphCanvasContent = (containerHeightClass: string) => (
    <div className={`relative w-full ${containerHeightClass} bg-slate-900/95 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center`}>
      {/* Background Grid Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <defs>
          <pattern id="graphGridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#64748B" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#graphGridPattern)" />
      </svg>

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Reset, Expand) */}
      <div className="absolute top-3 left-3 z-40 flex items-center gap-1 bg-slate-950/90 border border-slate-700/80 p-1 rounded-lg shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Phóng to (+)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer transition-colors"
        >
          <ZoomIn size={14} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Thu nhỏ (-)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          title="Khôi phục 100%"
          className="px-2 py-1 text-[10px] font-mono font-bold text-[#38BDF8] hover:bg-slate-800 rounded cursor-pointer transition-colors flex items-center gap-1"
        >
          <RotateCcw size={11} />
          <span>{(zoomScale * 100).toFixed(0)}%</span>
        </button>
        <div className="w-px h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          title="Mở rộng cửa sổ phóng to"
          className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded cursor-pointer transition-colors flex items-center gap-1 font-bold text-[10px]"
        >
          <Maximize2 size={14} />
          <span className="hidden sm:inline">Phóng to Modal</span>
        </button>
      </div>

      {/* Scalable Container with SVG viewBox Scaling */}
      <div 
        className="w-full h-full relative transition-transform duration-200 flex items-center justify-center"
        style={{ transform: `scale(${zoomScale})` }}
      >
        <svg 
          viewBox="0 0 850 400" 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-w-full max-h-full overflow-visible"
        >
          <defs>
            <marker id="arrow-primary" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38BDF8" />
            </marker>
            <marker id="arrow-competing" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#C084FC" />
            </marker>
            <marker id="arrow-normal" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94A3B8" />
            </marker>
          </defs>

          {/* SVG Edges Path */}
          {filteredEdges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.x;
            const y1 = sourceNode.y;
            const x2 = targetNode.x;
            const y2 = targetNode.y;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const isPrimary = edge.type === 'primary';
            const isCompeting = edge.type === 'competing';
            const isConnectedToHovered = activeHoverEdges.has(edge.id);

            const strokeColor = isConnectedToHovered ? '#F59E0B' : isPrimary ? '#38BDF8' : isCompeting ? '#C084FC' : '#64748B';
            const strokeWidth = isConnectedToHovered ? 3.5 : isPrimary ? 2.5 : 1.5;
            const markerId = isPrimary ? 'url(#arrow-primary)' : isCompeting ? 'url(#arrow-competing)' : 'url(#arrow-normal)';

            return (
              <g key={edge.id} className="transition-all duration-300">
                <path
                  d={`M ${x1} ${y1} Q ${midX} ${midY - 15} ${x2} ${y2}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isCompeting ? '4 4' : 'none'}
                  markerEnd={markerId}
                />
                <g transform={`translate(${midX}, ${midY - 18})`}>
                  <rect
                    x="-45"
                    y="-9"
                    width="90"
                    height="18"
                    rx="4"
                    fill="#0F172A"
                    stroke={strokeColor}
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={strokeColor}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {edge.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* SVG foreignObject Rendered Nodes - 100% Synced with SVG Coordinates */}
          {filteredNodes.map(node => {
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNode?.id === node.id;

            return (
              <foreignObject
                key={node.id}
                x={node.x - 90}
                y={node.y - 30}
                width="180"
                height="65"
                className="overflow-visible"
              >
                <div
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`w-full h-full cursor-pointer transition-all duration-200 ${
                    isHovered || isSelected ? 'scale-105 z-30' : 'hover:scale-105 z-20'
                  }`}
                >
                  <div 
                    style={{ borderColor: isHovered ? '#F59E0B' : node.borderColor }}
                    className="w-full h-full bg-slate-950/95 border-2 rounded-xl p-2 shadow-xl backdrop-blur-md flex items-center gap-2 transition-all"
                  >
                    <div 
                      style={{ backgroundColor: node.bgLight }}
                      className="p-1.5 rounded-lg shrink-0 flex items-center justify-center"
                    >
                      {renderIcon(node.iconName, node.color)}
                    </div>
                    <div className="overflow-hidden leading-tight">
                      <span 
                        style={{ color: node.color }} 
                        className="text-[8px] font-extrabold uppercase font-mono tracking-wider block truncate"
                      >
                        {node.type}
                      </span>
                      <h4 className="text-[10px] font-bold text-white truncate mt-0.5">
                        {node.label}
                      </h4>
                      {node.sublabel && (
                        <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">
                          {node.sublabel}
                        </p>
                      )}
                    </div>
                  </div>

                  {(isSelected || isHovered) && (
                    <div 
                      style={{ borderColor: isHovered ? '#F59E0B' : node.color }}
                      className="absolute -inset-1 border-2 rounded-2xl animate-pulse pointer-events-none"
                    />
                  )}
                </div>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      {/* RICH HOVER TOOLTIP CARD (Nổi bật thông tin khi di chuột) */}
      {hoveredNode && (
        <div className="absolute bottom-16 left-4 max-w-sm bg-slate-950/95 border-2 border-amber-500 rounded-xl p-3.5 backdrop-blur-xl text-white shadow-2xl z-50 space-y-2 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span 
              style={{ color: hoveredNode.color, backgroundColor: hoveredNode.bgLight }} 
              className="px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              {renderIcon(hoveredNode.iconName, hoveredNode.color)}
              {hoveredNode.type}
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
              <Sparkles size={11} />
              Chi tiết Đỉnh (Hover)
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white">{hoveredNode.label}</h4>
            {hoveredNode.sublabel && (
              <p className="text-[10px] text-slate-300 font-medium mt-0.5">{hoveredNode.sublabel}</p>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-serif bg-slate-900/80 p-2 rounded border border-slate-800">
            {hoveredNode.details || 'Không có mô tả chi tiết bổ sung.'}
          </p>

          {connectedNodeNames.length > 0 && (
            <div className="text-[9px] text-slate-400 font-mono pt-1 flex items-center gap-1 flex-wrap">
              <Link size={10} className="text-amber-400" />
              <span>Kết nối:</span>
              {connectedNodeNames.map((name, idx) => (
                <span key={idx} className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">
                  {name.slice(0, 25)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* XAI Reasoning Path Overlay Box */}
      {showXAIPath && (
        <div className="absolute top-3 right-3 max-w-xs bg-slate-950/85 border border-[#38BDF8]/40 rounded-xl p-2.5 backdrop-blur-md text-[10px] space-y-1 shadow-lg pointer-events-auto">
          <span className="font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1 font-mono">
            <Sparkles size={12} />
            Luồng Suy Luận XAI Graph Path
          </span>
          <div className="space-y-1 text-slate-300 font-medium">
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>1. Đỉnh Đối tượng ➔ Bóc tách nhân thân</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>2. Đỉnh Hung khí ➔ Phương tiện nguy hiểm</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>3. Đỉnh Hành vi ➔ Dấu hiệu khách quan</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>4. Đỉnh Thiệt hại ➔ Khung định lượng</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              <span>5. Đánh giá Cấu thành ➔ Điều {primaryArticle?.articleId || 168}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend Overlay at Bottom */}
      <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-300 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            Đối tượng
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            Hung khí/Phương tiện
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            Hành vi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Thiệt hại
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] inline-block" />
            Điều luật BLHS
          </span>
        </div>

        <span className="text-amber-400 text-[10px] font-bold flex items-center gap-1">
          <Info size={12} />
          * Di chuột vào Đỉnh để xem chi tiết • Bấm "Mở rộng Modal" để xem rõ hơn
        </span>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-sans uppercase tracking-wide">
            <Sparkles size={16} className="text-[#1c75bb]" />
            Sơ đồ Đồ thị Mối quan hệ Vụ án & Định tội danh
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Trích xuất trực quan liên kết: <span className="text-red-600">Đối tượng</span> ➔ <span className="text-amber-600">Hung khí/Phương tiện</span> ➔ <span className="text-blue-600">Hành vi</span> ➔ <span className="text-emerald-600">Tài sản</span> ➔ <span className="text-[#1c75bb]">Điều luật BLHS 2015</span>
          </p>
        </div>

        {/* Filter buttons & Fullscreen Expand Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setShowXAIPath(!showXAIPath)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              showXAIPath ? 'bg-[#1c75bb] text-white shadow-xs' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            <Sparkles size={12} />
            Luồng XAI Path
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              activeFilter === 'ALL' ? 'bg-white text-[#1c75bb] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('SUSPECT')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              activeFilter === 'SUSPECT' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đối tượng
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ACTION')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              activeFilter === 'ACTION' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hành vi & Hung khí
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ARTICLE')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              activeFilter === 'ARTICLE' ? 'bg-white text-[#1c75bb] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Điều luật định tội
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ml-1 active:scale-95"
          >
            <Maximize2 size={13} />
            <span>Mở rộng Modal</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      {renderGraphCanvasContent('h-[380px]')}

      {/* Selected Node Details Box or Distillation Note */}
      {selectedNode ? (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
          <div className="space-y-1">
            <span className="font-bold uppercase text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
              <Info size={12} className="text-[#1c75bb]" />
              Chi tiết nút: <strong className="text-slate-800">{selectedNode.label}</strong>
            </span>
            <p className="text-slate-700 font-semibold">{selectedNode.details || 'Không có mô tả bổ sung.'}</p>
          </div>
          <button 
            type="button"
            onClick={() => setSelectedNode(null)}
            className="text-[11px] font-bold text-[#1c75bb] hover:underline shrink-0 ml-4 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      ) : distillationNote ? (
        <div className="p-3 bg-[#EBF4FA] border border-[#BFDBFE] rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
          <Sparkles size={16} className="text-[#1c75bb] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#1c75bb] block text-[11px] uppercase tracking-wider font-mono">
              Phân định Đồ thị Tri thức (GNN Distillation Note)
            </span>
            <p className="font-semibold text-slate-800 mt-0.5 leading-relaxed">
              {distillationNote}
            </p>
          </div>
        </div>
      ) : null}

      {/* CLEAN HIGH-RESOLUTION GRAPH MODAL DIALOG */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        >
          {/* Modal Card Content Container */}
          <div 
            className="w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1c75bb]/20 border border-[#1c75bb]/40 rounded-xl text-[#38BDF8]">
                  <Layers size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    SƠ ĐỒ ĐỒ THỊ MỐI QUAN HỆ VỤ ÁN (CHẾ ĐỘ MỞ RỘNG)
                    <span className="text-[9px] bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] px-2 py-0.5 rounded font-mono">
                      HIGH-RES GRAPH INSPECTOR
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Mã vụ án: <strong className="text-red-400 font-mono">{caseCode}</strong> • Di chuột để xem chi tiết • Bấm ESC hoặc nút Đóng để thoát
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <X size={16} />
                  <span>Đóng Modal (ESC)</span>
                </button>
              </div>
            </div>

            {/* Modal Canvas Body */}
            <div className="flex-1 w-full p-4 bg-slate-950">
              {renderGraphCanvasContent('h-full')}
            </div>

            {/* Modal Footer */}
            {selectedNode && (
              <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 text-xs flex justify-between items-center text-slate-200">
                <div>
                  <span className="font-bold text-amber-400 uppercase text-[10px] font-mono">
                    Đã chọn: {selectedNode.label} ({selectedNode.type})
                  </span>
                  <p className="text-slate-300 font-medium text-[11px] mt-0.5">{selectedNode.details}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-xs font-bold text-[#38BDF8] hover:underline"
                >
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseGraphVisualizer;
