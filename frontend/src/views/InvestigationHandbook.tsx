import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRight, 
  ClipboardList, 
  Scale, 
  Archive,
  Info
} from 'lucide-react';

export const InvestigationHandbook: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'filing' | 'steps' | 'responsibilities'>('filing');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const stepsData = [
    {
      phase: 'Giai đoạn 1: Tiếp nhận và giải quyết nguồn tin về tội phạm',
      timeLimit: 'Thời hạn: 20 ngày (gia hạn tối đa 02 tháng đối với vụ việc phức tạp) - Điều 147 BLTTHS',
      steps: [
        { id: 'p1_s1', text: 'Tiếp nhận đơn trình báo, tố giác tội phạm, tin báo hoặc kiến nghị khởi tố.' },
        { id: 'p1_s2', text: 'Lập biên bản tiếp nhận, ghi lời khai ban đầu của người trình báo/tố giác.' },
        { id: 'p1_s3', text: 'Tiến hành kiểm tra hiện trường, xác minh sơ bộ nhân thân đối tượng nghi vấn.' },
        { id: 'p1_s4', text: 'Trưng cầu giám định hoặc yêu cầu định giá tài sản khẩn cấp (nếu cần).' },
        { id: 'p1_s5', text: 'Báo cáo đề xuất Thủ trưởng CQĐT ra Quyết định khởi tố vụ án hình sự hoặc quyết định không khởi tố.' }
      ]
    },
    {
      phase: 'Giai đoạn 2: Khởi tố vụ án và khởi tố bị can',
      timeLimit: 'Thời hạn: Trong vòng 24 giờ phải gửi Quyết định khởi tố cho Viện kiểm sát - Điều 154, 179 BLTTHS',
      steps: [
        { id: 'p2_s1', text: 'Soạn thảo Quyết định khởi tố vụ án hình sự.' },
        { id: 'p2_s2', text: 'Soạn thảo Quyết định khởi tố bị can (nếu đã xác định rõ đối tượng thực hiện hành vi tội phạm).' },
        { id: 'p2_s3', text: 'Gửi hồ sơ đề nghị phê chuẩn Quyết định khởi tố bị can và Lệnh tạm giam/bắt bị can (nếu áp dụng) sang Viện kiểm sát.' },
        { id: 'p2_s4', text: 'Giao trực tiếp các quyết định khởi tố và giải thích quyền, nghĩa vụ cho bị can.' }
      ]
    },
    {
      phase: 'Giai đoạn 3: Tiến hành các biện pháp điều tra thu thập chứng cứ',
      timeLimit: 'Thời hạn điều tra: Ít nghiêm trọng (02 tháng), Nghiêm trọng (03 tháng), Rất nghiêm trọng (04 tháng), Đặc biệt nghiêm trọng (04 tháng) - Điều 172 BLTTHS',
      steps: [
        { id: 'p3_s1', text: 'Tiến hành hỏi cung bị can (bắt buộc ghi âm/ghi hình có âm thanh nếu bị can kêu oan hoặc vụ án đặc biệt nghiêm trọng).' },
        { id: 'p3_s2', text: 'Lấy lời khai bị hại, người làm chứng, người có quyền lợi nghĩa vụ liên quan.' },
        { id: 'p3_s3', text: 'Tiến hành đối chất (nếu có mâu thuẫn lớn trong lời khai của các đối tượng).' },
        { id: 'p3_s4', text: 'Thực hiện các lệnh khám xét (chỗ ở, nơi làm việc, người) để thu giữ vật chứng.' },
        { id: 'p3_s5', text: 'Tổ chức thực nghiệm điều tra (dựng lại hiện trường hành vi phạm tội để kiểm chứng lời khai).' },
        { id: 'p3_s6', text: 'Theo dõi, đôn đốc nhận kết luận giám định pháp y, giám định kỹ thuật hình sự, định giá tài sản.' }
      ]
    },
    {
      phase: 'Giai đoạn 4: Áp dụng biện pháp ngăn chặn và thời hạn luật định',
      timeLimit: 'Lưu ý kiểm soát chặt chẽ thời hạn để tránh vi phạm tố tụng nghiêm trọng',
      steps: [
        { id: 'p4_s1', text: 'Thời hạn Tạm giữ: Tối đa 03 ngày. Có thể gia hạn lần 1 (03 ngày), lần 2 (03 ngày) -> Tổng tối đa 09 ngày (Điều 118).' },
        { id: 'p4_s2', text: 'Thời hạn Tạm giam phục vụ điều tra: Không được quá thời hạn điều tra vụ án. Việc gia hạn tạm giam do Viện kiểm sát phê chuẩn.' },
        { id: 'p4_s3', text: 'Kiểm tra điều kiện áp dụng biện pháp thay thế: Bảo lĩnh (Điều 121) hoặc Cấm đi khỏi nơi cư trú (Điều 123).' }
      ]
    },
    {
      phase: 'Giai đoạn 5: Kết thúc điều tra và chuyển hồ sơ vụ án',
      timeLimit: 'Thời hạn: Gửi hồ sơ và Bản kết luận điều tra sang Viện kiểm sát ngay khi kết thúc điều tra',
      steps: [
        { id: 'p5_s1', text: 'Hệ thống hóa toàn bộ hồ sơ vụ án, đánh số bút lục chính thức và lập bảng mục lục tài liệu.' },
        { id: 'p5_s2', text: 'Dự thảo Bản kết luận điều tra đề nghị truy tố bị can (hoặc đình chỉ/tạm đình chỉ điều tra).' },
        { id: 'p5_s3', text: 'Báo cáo Thủ trưởng cơ quan điều tra ký duyệt Bản kết luận điều tra.' },
        { id: 'p5_s4', text: 'Gửi Bản kết luận điều tra cho bị can, người bào chữa (luật sư) và thông báo cho bị hại.' },
        { id: 'p5_s5', text: 'Bàn giao toàn bộ hồ sơ vụ án vật lý sang Viện kiểm sát nhân dân cùng cấp.' }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      
      {/* Title block */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#126DA6] flex items-center justify-center text-[#FFD700] shadow-sm shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#126DA6] uppercase tracking-wide">
              Cẩm nang Nghiệp vụ Điều tra
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Tài liệu nghiên cứu, quy trình tác nghiệp và sổ tay hướng dẫn thực tế cho Điều tra viên theo luật định Việt Nam.
            </p>
          </div>
        </div>
        
        {/* Quick status box */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg text-[#065F46] text-xs font-semibold self-start md:self-auto">
          <ShieldCheck size={16} className="text-[#065F46]" />
          <span>Tuân thủ Bộ luật Tố tụng hình sự 2015</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-px">
        <button
          onClick={() => setActiveTab('filing')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-b-2 cursor-pointer ${
            activeTab === 'filing'
              ? 'border-[#C09A36] text-[#EF4444] bg-white rounded-t-md shadow-sm font-extrabold'
              : 'border-transparent text-slate-500 hover:text-[#126DA6] hover:bg-[#F8FAFC]'
          }`}
        >
          <Archive size={16} />
          <span>Quy trình lập hồ sơ vụ án</span>
        </button>
        
        <button
          onClick={() => setActiveTab('steps')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-b-2 cursor-pointer ${
            activeTab === 'steps'
              ? 'border-[#C09A36] text-[#EF4444] bg-white rounded-t-md shadow-sm font-extrabold'
              : 'border-transparent text-slate-500 hover:text-[#126DA6] hover:bg-[#F8FAFC]'
          }`}
        >
          <ClipboardList size={16} />
          <span>Hướng dẫn các bước xử lý vụ án</span>
        </button>

        <button
          onClick={() => setActiveTab('responsibilities')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-150 border-b-2 cursor-pointer ${
            activeTab === 'responsibilities'
              ? 'border-[#C09A36] text-[#EF4444] bg-white rounded-t-md shadow-sm font-extrabold'
              : 'border-transparent text-slate-500 hover:text-[#126DA6] hover:bg-[#F8FAFC]'
          }`}
        >
          <Scale size={16} />
          <span>Trách nhiệm của Điều tra viên</span>
        </button>
      </div>

      {/* Tab 1: Quy trình lập hồ sơ vụ án */}
      {activeTab === 'filing' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {/* Legal Basis */}
            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-[#126DA6] uppercase border-l-4 border-[#EF4444] pl-3">
                1. Căn cứ Pháp lý & Khái niệm cơ bản
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Căn cứ <strong>Điều 131 Bộ luật Tố tụng hình sự 2015</strong>, khi tiến hành các hoạt động điều tra, Điều tra viên phải lập hồ sơ vụ án hình sự. Hồ sơ vụ án hình sự là tập hợp các văn bản tố tụng, biên bản điều tra, tài liệu, đồ vật được thu thập theo trình tự luật định phản ánh toàn bộ quá trình khởi tố, điều tra vụ án nhằm làm căn cứ giải quyết vụ án một cách khách quan, toàn diện.
              </p>
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-4 text-xs text-[#B45309] flex gap-3">
                <AlertTriangle size={18} className="text-[#B45309] shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-1">Yêu cầu tuyệt đối về tính hợp pháp:</strong>
                  Mọi tài liệu, chứng cứ đưa vào hồ sơ vụ án phải được thu thập đúng trình tự, thủ tục do luật định. Chứng cứ thu thập trái pháp luật sẽ không có giá trị pháp lý và không được dùng làm căn cứ để giải quyết vụ án.
                </div>
              </div>
            </div>

            {/* Document Categories */}
            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-[#126DA6] uppercase border-l-4 border-[#EF4444] pl-3">
                2. Phân loại tài liệu trong hồ sơ vụ án
              </h3>
              
              <div className="space-y-4">
                <div className="border border-[#E2E8F0] rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <span className="text-xs font-bold text-[#EF4444] block mb-1">Nhóm I: Tài liệu về khởi tố, thủ tục hành chính tư pháp</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Quyết định khởi tố vụ án; Quyết định khởi tố bị can; Quyết định phân công Điều tra viên, Cán bộ điều tra; Biên bản phê chuẩn của Viện kiểm sát; Các lệnh bắt, lệnh tạm giữ, quyết định tạm giam; Quyết định phân công Kiểm sát viên; Biên bản giao nhận các văn bản tố tụng.
                  </p>
                </div>

                <div className="border border-[#E2E8F0] rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <span className="text-xs font-bold text-[#EF4444] block mb-1">Nhóm II: Tài liệu chứng minh tội phạm (Chứng cứ thu thập)</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Biên bản khám nghiệm hiện trường, sơ đồ và bản ảnh hiện trường; Biên bản khám xét; Biên bản thu giữ vật chứng, tài liệu; Kết luận giám định tư pháp (pháp y, ma túy, tài chính...); Biên bản định giá tài sản; Biên bản hỏi cung bị can; Biên bản ghi lời khai bị hại, người làm chứng, người liên quan; Biên bản đối chất, biên bản thực nghiệm điều tra.
                  </p>
                </div>

                <div className="border border-[#E2E8F0] rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <span className="text-xs font-bold text-[#EF4444] block mb-1">Nhóm III: Tài liệu về lý lịch, nhân thân bị can</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Bản tự khai của bị can; Sơ yếu lý lịch bị can; Bản trích lục tiền án, tiền sự (lý lịch tư pháp); Danh bản, bản ảnh chỉ bản (dấu vân tay); Biên bản xác minh lý lịch nhân thân bị can tại địa phương hoặc nơi làm việc; Các tài liệu liên quan đến tình tiết giảm nhẹ hoặc tăng nặng trách nhiệm hình sự.
                  </p>
                </div>

                <div className="border border-[#E2E8F0] rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <span className="text-xs font-bold text-[#EF4444] block mb-1">Nhóm IV: Tài liệu kết thúc giai đoạn điều tra</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Bản kết luận điều tra đề nghị truy tố (hoặc Quyết định đình chỉ, tạm đình chỉ điều tra); Biên bản kết thúc điều tra và bàn giao hồ sơ; Thống kê toàn bộ tài liệu có trong hồ sơ vụ án; Biên bản giao nhận hồ sơ giữa Cơ quan điều tra và Viện kiểm sát.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines sidebar */}
          <div className="space-y-6 col-span-1">
            <div className="bg-[#126DA6] text-white rounded-lg shadow-sm p-6 space-y-4 border-b-[3px] border-[#C09A36]">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FFD700]">
                Quy cách Quản lý Hồ sơ
              </h4>
              <ul className="space-y-3.5 text-[11px] text-white/90">
                <li className="flex gap-2">
                  <ArrowRight size={14} className="text-[#FFD700] shrink-0 mt-0.5" />
                  <span><strong>Đánh số bút lục:</strong> Ngay khi đưa tài liệu vào hồ sơ, Điều tra viên phải đánh số thứ tự trang (bút lục) liên tục từ 1 đến hết bằng bút mực màu xanh ở góc phải phía trên của trang giấy.</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight size={14} className="text-[#FFD700] shrink-0 mt-0.5" />
                  <span><strong>Sắp xếp tài liệu:</strong> Sắp xếp theo nhóm tài liệu hoặc theo trình tự thời gian xảy ra hoạt động điều tra tố tụng. Nghiêm cấm xáo trộn hoặc tự ý tiêu hủy tài liệu trong hồ sơ.</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight size={14} className="text-[#FFD700] shrink-0 mt-0.5" />
                  <span><strong>Thống kê tài liệu:</strong> Phải lập bảng thống kê chi tiết gồm: Tên tài liệu, số bút lục từ trang... đến trang..., ngày lập tài liệu, người lập tài liệu.</span>
                </li>
                <li className="flex gap-2">
                  <ArrowRight size={14} className="text-[#FFD700] shrink-0 mt-0.5" />
                  <span><strong>Đóng tập và khâu hồ sơ:</strong> Khi chuyển hồ sơ sang VKS hoặc lưu trữ, hồ sơ phải được đục lỗ, khâu bằng chỉ chuyên dụng, có tờ bìa lót ghi rõ số lượng trang và niêm phong có dấu của cơ quan điều tra.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 space-y-3.5 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-[#126DA6]">
                <Info size={16} className="text-[#EF4444]" />
                <span>Kiểm tra hồ sơ vụ án</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Trước khi kết thúc điều tra, Kiểm sát viên thụ lý sẽ kiểm tra hồ sơ (kiểm sát điều tra). Mọi tài liệu bị thiếu chữ ký của người tham gia tố tụng, Điều tra viên hoặc bị tẩy xóa mà không có xác nhận sẽ bị trả lại để điều tra bổ sung hoặc khắc phục lỗi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hướng dẫn các bước xử lý vụ án */}
      {activeTab === 'steps' && (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#E2E8F0] pb-4 mb-6 gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#126DA6] uppercase">
                  Trình tự Tác nghiệp của Điều tra viên
                </h3>
                <p className="text-xs text-slate-500">
                  Điều tra viên có thể sử dụng checklist này làm tài liệu tham chiếu quy trình chuẩn khi thụ lý một vụ việc hình sự mới.
                </p>
              </div>
              <button 
                onClick={() => setCompletedSteps({})}
                className="text-xs font-bold text-[#EF4444] hover:underline cursor-pointer"
              >
                Đặt lại Checklist
              </button>
            </div>

            {/* Checklist phases */}
            <div className="space-y-8">
              {stepsData.map((phase, pIdx) => (
                <div key={pIdx} className="space-y-4">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#126DA6] uppercase tracking-wide">
                      {phase.phase}
                    </span>
                    <span className="text-[10px] text-[#EF4444] font-mono font-bold bg-white border border-[#EF4444]/20 px-2 py-1 rounded-lg">
                      {phase.timeLimit}
                    </span>
                  </div>

                  <div className="pl-2 space-y-3">
                    {phase.steps.map((step) => {
                      const isDone = !!completedSteps[step.id];
                      return (
                        <div 
                          key={step.id} 
                          onClick={() => toggleStep(step.id)}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer select-none ${
                            isDone 
                              ? 'bg-emerald-50/45 border-emerald-200/80 text-slate-500' 
                              : 'bg-white border-[#E2E8F0] hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors mt-0.5 ${
                            isDone 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isDone && <CheckSquare size={14} />}
                          </div>
                          <span className={`text-xs ${isDone ? 'line-through text-slate-400' : 'font-medium'}`}>
                            {step.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Trách nhiệm của Điều tra viên */}
      {activeTab === 'responsibilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Duties and Powers */}
            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-[#102A43] uppercase border-l-4 border-[#A31D1D] pl-3">
                1. Nhiệm vụ và Quyền hạn theo luật định (Điều 37 BLTTHS)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khi được phân công tiến hành điều tra vụ án hình sự, Điều tra viên có các nhiệm vụ, quyền hạn sau đây:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <strong className="text-[#102A43] font-bold block">Quyền tiến hành các hoạt động tố tụng:</strong>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-600 text-[11px]">
                    <li>Lập hồ sơ vụ án hình sự.</li>
                    <li>Triệu tập và lấy lời khai của bị hại, người làm chứng, người tố giác.</li>
                    <li>Triệu tập và hỏi cung bị can.</li>
                    <li>Quyết định áp giải bị can, áp giải người làm chứng.</li>
                    <li>Tiến hành khám hiện trường, khám nghiệm tử thi, đối chất, nhận dạng, thực nghiệm điều tra.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <strong className="text-[#102A43] font-bold block">Quyền đề xuất lệnh và biện pháp cưỡng chế:</strong>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-600 text-[11px]">
                    <li>Đề xuất Thủ trưởng CQĐT ra quyết định khởi tố vụ án, khởi tố bị can.</li>
                    <li>Đề xuất lệnh bắt giữ người, tạm giữ, tạm giam bị can.</li>
                    <li>Đề xuất lệnh khám xét, thu giữ đồ vật, tài liệu, niêm phong vật chứng.</li>
                    <li>Đề xuất trưng cầu giám định tư pháp, trưng cầu định giá tài sản.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Investigator Prohibitions */}
            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-[#126DA6] uppercase border-l-4 border-[#EF4444] pl-3">
                2. Những hành vi bị nghiêm cấm đối với Điều tra viên
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Để bảo vệ quyền con người và tính khách quan của hoạt động tư pháp, pháp luật nghiêm cấm Điều tra viên thực hiện các hành vi sau:
              </p>
              
              <div className="space-y-3.5">
                <div className="flex gap-3 items-start border-b border-slate-100 pb-3">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[#EF4444] font-bold text-xs shrink-0 mt-0.5 border border-[#FECACA]">
                    1
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">Bức cung, dùng nhục hình (Điều 373, 374 Bộ luật Hình sự 2015)</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                      Nghiêm cấm dùng bạo lực, đe dọa hoặc dùng các thủ đoạn tinh thần khác buộc bị can phải khai theo ý muốn của mình. Đây là tội danh nghiêm trọng cấu thành tội phạm hình sự xâm phạm hoạt động tư pháp.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-start border-b border-slate-100 pb-3">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[#EF4444] font-bold text-xs shrink-0 mt-0.5 border border-[#FECACA]">
                    2
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">Làm sai lệch hồ sơ vụ án hình sự (Điều 375 Bộ luật Hình sự 2015)</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                      Nghiêm cấm thêm, bớt, tẩy xóa, sửa chữa, thay đổi, tiêu hủy tài liệu, chứng cứ hoặc cố ý đưa các chứng cứ giả vào hồ sơ vụ án làm ảnh hưởng đến việc phán quyết đúng đắn của Tòa án.
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-[#EF4444] font-bold text-xs shrink-0 mt-0.5 border border-[#FECACA]">
                    3
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">Tiết lộ bí mật điều tra vụ án</strong>
                    <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                      Nghiêm cấm cung cấp trái phép thông tin về vụ án đang trong quá trình điều tra cho các tổ chức, cá nhân bên ngoài hoặc báo chí mà không có sự đồng ý của Thủ trưởng cơ quan điều tra và người có trách nhiệm.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Liability Sidebar */}
          <div className="space-y-6 col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 space-y-4">
              <h4 className="text-xs font-extrabold uppercase text-[#126DA6] tracking-wide border-b border-[#E2E8F0] pb-2">
                Trách nhiệm cá nhân trước pháp luật
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Điều tra viên phải chịu trách nhiệm cá nhân trước pháp luật và trước Thủ trưởng Cơ quan điều tra về mọi hành vi và quyết định của mình trong hoạt động tố tụng.
              </p>
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-[11px] text-[#991B1B] leading-relaxed">
                <strong className="font-bold text-[#EF4444] block mb-1">Chế tài khi vi phạm:</strong>
                Tùy theo tính chất và mức độ vi phạm, Điều tra viên vi phạm pháp luật tố tụng có thể bị đình chỉ công tác, thu hồi thẻ Điều tra viên, kỷ luật hành chính hoặc bị truy cứu trách nhiệm hình sự theo các tội danh tại <strong>Chương XXIV Bộ luật Hình sự 2015 (Các tội xâm phạm hoạt động tư pháp)</strong>.
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6 space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase text-[#126DA6] tracking-wide border-b border-[#E2E8F0] pb-2">
                Nguyên tắc tự bảo vệ của Điều tra viên
              </h4>
              <ul className="space-y-3 text-[11px] text-slate-600">
                <li className="flex gap-2">
                  <span className="text-[#EF4444] font-bold">•</span>
                  <span><strong>Kịp thời báo cáo:</strong> Luôn xin ý kiến Thủ trưởng cơ quan điều tra bằng văn bản đối với các tình huống phức tạp hoặc có sự can thiệp từ bên ngoài.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#EF4444] font-bold">•</span>
                  <span><strong>Lưu vết đầy đủ:</strong> Ghi chép chi tiết nhật ký quá trình tiếp xúc đối tượng, làm việc với Viện kiểm sát và thu giữ tài liệu chứng cứ.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#EF4444] font-bold">•</span>
                  <span><strong>Lắng nghe ý kiến Viện kiểm sát:</strong> Phối hợp chặt chẽ với Kiểm sát viên thụ lý để kịp thời giải quyết các yêu cầu điều tra.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
export default InvestigationHandbook;
