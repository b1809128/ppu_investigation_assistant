import os
import re
import json
import time
import subprocess
from concurrent.futures import ProcessPoolExecutor
from pypdf import PdfReader

# Paths
DATA_DIR = "/Users/quochuy/QH_Code/Software/Investigation_Assistant/data"
OUTPUT_JSON_PATH = "/Users/quochuy/QH_Code/Software/Investigation_Assistant/app/data/bo_luat_hinh_su_2015.json"
SCRATCH_DIR = "/Users/quochuy/.gemini/antigravity-ide/brain/eb9fa7c4-c18c-4905-abbf-7e558a426ed1/scratch"
OCR_PAGES_DIR = os.path.join(SCRATCH_DIR, "ocr_pages")

os.makedirs(OCR_PAGES_DIR, exist_ok=True)

# 1. OCR worker function
def ocr_single_page(args):
    pdf_name, page_idx, global_idx = args
    pdf_path = os.path.join(DATA_DIR, pdf_name)
    txt_out_path = os.path.join(OCR_PAGES_DIR, f"page_{global_idx}.txt")
    
    # Check if already processed
    if os.path.exists(txt_out_path):
        return global_idx, True
    
    try:
        reader = PdfReader(pdf_path)
        page = reader.pages[page_idx]
        if len(page.images) == 0:
            # Fallback to direct text if no images
            text = page.extract_text() or ""
            with open(txt_out_path, "w", encoding="utf-8") as f:
                f.write(text)
            return global_idx, True
        
        # Extract image
        img = page.images[0]
        img_path = os.path.join(OCR_PAGES_DIR, f"temp_page_{global_idx}.png")
        txt_base = os.path.join(OCR_PAGES_DIR, f"temp_page_{global_idx}_txt")
        
        with open(img_path, "wb") as f:
            f.write(img.data)
            
        # Run tesseract
        subprocess.run(
            ["/opt/homebrew/bin/tesseract", img_path, txt_base, "-l", "vie"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        tesseract_txt = txt_base + ".txt"
        if os.path.exists(tesseract_txt):
            with open(tesseract_txt, "r", encoding="utf-8") as f:
                text = f.read()
            with open(txt_out_path, "w", encoding="utf-8") as f:
                f.write(text)
            os.remove(tesseract_txt)
        else:
            # Fallback
            with open(txt_out_path, "w", encoding="utf-8") as f:
                f.write("")
                
        if os.path.exists(img_path):
            os.remove(img_path)
            
        return global_idx, True
    except Exception as e:
        print(f"Error processing {pdf_name} page {page_idx} (global {global_idx}): {e}")
        return global_idx, False

# 2. Main execution flow
def run_ocr():
    # File 1: pages 1 to 150 (indices 0 to 149)
    # File 2: pages 151 to 305 (indices 0 to 154)
    tasks = []
    
    # 100.signed_01.pdf (pages 1-150)
    reader1 = PdfReader(os.path.join(DATA_DIR, "100.signed_01.pdf"))
    for idx in range(len(reader1.pages)):
        tasks.append(("100.signed_01.pdf", idx, idx))
        
    # 100_.pdf (pages 151-305)
    reader2 = PdfReader(os.path.join(DATA_DIR, "100_.pdf"))
    start_global = len(tasks)
    for idx in range(len(reader2.pages)):
        tasks.append(("100_.pdf", idx, start_global + idx))
        
    total_pages = len(tasks)
    print(f"Total pages to OCR: {total_pages}")
    
    # Check what's already completed
    completed_before = sum(1 for _, _, g_idx in tasks if os.path.exists(os.path.join(OCR_PAGES_DIR, f"page_{g_idx}.txt")))
    print(f"Already completed pages: {completed_before}/{total_pages}")
    
    if completed_before < total_pages:
        print("Starting parallel OCR using ProcessPoolExecutor...")
        start_time = time.time()
        with ProcessPoolExecutor(max_workers=6) as executor:
            results = list(executor.map(ocr_single_page, tasks))
        end_time = time.time()
        print(f"OCR execution finished in {end_time - start_time:.2f} seconds.")
    else:
        print("All pages already OCRed. Skipping OCR step.")

# 3. Parser function
def parse_ocr_results():
    print("Reading and parsing OCR text files...")
    
    # Read all pages in order
    all_pages_text = []
    total_pages = 305
    for idx in range(total_pages):
        txt_path = os.path.join(OCR_PAGES_DIR, f"page_{idx}.txt")
        if not os.path.exists(txt_path):
            print(f"Warning: Missing page text file {txt_path}")
            continue
        with open(txt_path, "r", encoding="utf-8") as f:
            all_pages_text.append(f.read())
            
    full_text = "\n".join(all_pages_text)
    
    # Split text into lines and clean
    lines = [line.strip() for line in full_text.split("\n")]
    
    # Regex definitions
    chapter_regex = re.compile(r"^CHƯƠNG\s+([I|V|X|L|C]+)\b", re.IGNORECASE)
    article_regex = re.compile(r"^(Đi[ề|ê|e]u|Di[ề|ê|e]u|Dieu)\s*['\-\s]*(\d+)\s*[\.,:\s-]\s*(.*)", re.IGNORECASE)
    
    articles = []
    
    current_chapter = ""
    current_chapter_title = ""
    current_article = None
    
    # Temp variable to find chapter titles
    looking_for_chapter_title = False
    
    # List of common crime keywords for auto-tagging
    common_keywords_map = {
        "trộm cắp": ["trộm cắp", "lấy trộm", "trộm tài sản", "cạy cửa", "móc túi", "ăn trộm"],
        "gây thương tích": ["cố ý gây thương tích", "gây tổn hại sức khỏe", "đánh người", "hành hung", "thương tích", "chém người", "axit"],
        "lừa đảo": ["lừa đảo", "chiếm đoạt", "gian dối", "gạt tiền", "chiếm đoạt tài sản", "lừa tiền", "giả mạo"],
        "chống người thi hành": ["chống người thi hành công vụ", "cản trở cảnh sát", "chống đối", "tấn công cảnh sát", "chống cự"],
        "tham ô": ["tham ô", "chiếm đoạt tài sản nhà nước", "tham nhũng", "lợi dụng chức vụ", "thụt két"],
        "nhận hối lộ": ["nhận hối lộ", "hối lộ", "lấy tiền", "đút lót", "lo lót", "nhận tiền chạy án"],
        "đưa hối lộ": ["đưa hối lộ", "đút lót", "mua chuộc", "lo lót"],
        "giết người": ["giết người", "sát hại", "đâm chết", "chém chết", "đầu độc", "tước đoạt tính mạng"],
        "cướp tài sản": ["cướp tài sản", "khống chế", "đe dọa dùng vũ lực", "cướp giật", "giật điện thoại", "giật túi xách"],
        "ma túy": ["ma túy", "tàng trữ trái phép chất ma túy", "mua bán ma túy", "vận chuyển ma túy", "heroin", "methamphetamine", "khay", "kẹo", "đá"],
        "đánh bạc": ["đánh bạc", "tổ chức đánh bạc", "gá bạc", "sòng bạc", "lô đề", "cá độ", "phỏm", "tài xỉu"],
        "hiếp dâm": ["hiếp dâm", "cưỡng bức", "giao cấu trái ý muốn", "quan hệ tình dục trái ý muốn"],
        "buôn lậu": ["buôn lậu", "vận chuyển trái phép qua biên giới", "hàng lậu", "trốn thuế"],
        "gây rối trật tự": ["gây rối trật tự công cộng", "hò hét", "đập phá", "gây mất an ninh"],
        "vi phạm giao thông": ["vi phạm giao thông", "gây tai nạn", "tông xe", "lái xe gây tai nạn", "đâm xe", "đụng xe", "chạy quá tốc độ", "say rượu lái xe"]
    }
    
    # Clean stopwords for extracting keywords from titles
    stopwords = {"của", "và", "tội", "về", "trong", "các", "người", "hành", "vi", "sự", "những", "đối", "với", "cho", "hoặc", "khi", "tại", "phạm", "luật", "điều", "khoản", "bản"}
    
    for idx, line in enumerate(lines):
        if not line:
            continue
            
        # Match Chapter
        chap_match = chapter_regex.match(line)
        if chap_match:
            current_chapter = chap_match.group(1).upper()
            looking_for_chapter_title = True
            current_chapter_title = ""
            continue
            
        if looking_for_chapter_title:
            # The next non-empty line after "CHƯƠNG X" is usually the title.
            # However, skip lines that are page numbers, parts, or headers.
            if not line.isdigit() and not line.startswith("PHẦN") and not article_regex.match(line):
                current_chapter_title = line
                looking_for_chapter_title = False
                continue
                
        # Match Article
        art_match = article_regex.match(line)
        if art_match:
            # Save previous article
            if current_article:
                articles.append(current_article)
                
            art_num = int(art_match.group(2))
            art_title = art_match.group(3).strip()
            
            current_article = {
                "chuong": current_chapter,
                "ten_chuong": current_chapter_title,
                "dieu": art_num,
                "ten_dieu": art_title,
                "noi_dung": "",
                "keywords": []
            }
            continue
            
        # If we are inside an article, append line to content
        if current_article:
            # Filter out lines that are headers, footers or page numbers
            if line.isdigit():
                continue
            if "bộ luật hình sự" in line.lower() and len(line) < 30:
                continue
                
            # Clean up line endings/hyphenations
            if current_article["noi_dung"]:
                if current_article["noi_dung"].endswith("-"):
                    current_article["noi_dung"] = current_article["noi_dung"][:-1] + line
                else:
                    current_article["noi_dung"] += " " + line
            else:
                current_article["noi_dung"] = line
                
    # Save the last article
    if current_article:
        articles.append(current_article)
        
    print(f"Total raw parsed articles: {len(articles)}")
    
    # Post-process: Clean up content, validate sequential order, auto-generate keywords
    cleaned_articles = []
    
    for art in articles:
        # Clean double spaces
        content = art["noi_dung"]
        content = re.sub(r'\s+', ' ', content)
        art["noi_dung"] = content.strip()
        
        # Populate chapter title if empty
        if not art["ten_chuong"]:
            # Lookup chapter title from previous articles of the same chapter
            for prev_art in cleaned_articles:
                if prev_art["chuong"] == art["chuong"] and prev_art["ten_chuong"]:
                    art["ten_chuong"] = prev_art["ten_chuong"]
                    break
        
        # Clean chapter title
        if art["ten_chuong"]:
            art["ten_chuong"] = re.sub(r'\s+', ' ', art["ten_chuong"]).strip()
            
        # Clean article title
        art["ten_dieu"] = re.sub(r'\s+', ' ', art["ten_dieu"]).strip()
        
        # Auto-generate keywords
        kws = set()
        title_lower = art["ten_dieu"].lower()
        content_lower = art["noi_dung"].lower()
        
        # 1. Match against common crime keywords map
        for key, klist in common_keywords_map.items():
            if key in title_lower or any(k in content_lower for k in klist):
                for kw in klist:
                    kws.add(kw)
                    
        # 2. Add the title itself as a keyword phrase (removing "tội " prefix if present)
        core_title = title_lower
        if core_title.startswith("tội "):
            core_title = core_title[4:].strip()
        kws.add(core_title)
                
        # 3. Add custom combinations based on title
        if "giết" in title_lower:
            kws.add("giết người")
            kws.add("sát hại")
        if "trộm" in title_lower:
            kws.add("trộm cắp")
            kws.add("lấy trộm")
        if "gây thương tích" in title_lower:
            kws.add("đánh người")
            kws.add("hành hung")
            
        art["keywords"] = list(kws)
        
        cleaned_articles.append(art)
        
    # Sort by article number
    cleaned_articles.sort(key=lambda x: x["dieu"])
    
    # Remove duplicates if any (due to page boundaries)
    unique_articles = {}
    for art in cleaned_articles:
        unique_articles[art["dieu"]] = art
        
    final_articles = list(unique_articles.values())
    final_articles.sort(key=lambda x: x["dieu"])
    
    # Verify sequence and print missing
    article_nums = [x["dieu"] for x in final_articles]
    missing = []
    for i in range(1, 427):
        if i not in article_nums:
            missing.append(i)
    if missing:
        print(f"Warning: Missing article numbers in sequence: {missing}")
    else:
        print("Success: All articles from 1 to 426 parsed sequentially with no gaps!")
        
    # Save to file
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(final_articles, f, ensure_ascii=False, indent=2)
        
    print(f"Saved {len(final_articles)} articles to {OUTPUT_JSON_PATH}")

if __name__ == "__main__":
    run_ocr()
    parse_ocr_results()
