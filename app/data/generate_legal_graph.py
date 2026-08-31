import os
import re
import json
from typing import Dict, Any, List

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PENAL_CODE_JSON = os.path.join(ROOT_DIR, "app", "data", "bo_luat_hinh_su_2015.json")
OUTPUT_GRAPH_JSON = os.path.join(ROOT_DIR, "app", "data", "legal_knowledge_graph.json")

def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()

def parse_clauses(content: str) -> List[Dict[str, Any]]:
    """
    Parses clauses (Khoản) from article content.
    Usually formatted as "1. ... 2. ... 3. ..." in Vietnamese legal documents.
    """
    clauses = []
    if not content:
        return clauses

    # Find numbers followed by dot and space, e.g., "1. " or "2. "
    pattern = re.compile(r'(\d+)\.\s+([^0-9]+|(?:\d+(?!\.\s+))[^0-9]*)')
    matches = pattern.findall(content)
    
    if not matches:
        # Fallback if no numeric clauses, treat entire content as Clause 1
        clauses.append({
            "clause_number": 1,
            "content": content
        })
        return clauses

    for idx, match in enumerate(matches):
        clause_num = int(match[0])
        clause_text = clean_text(match[1])
        
        # Strip trailing numbers of next clauses if they leaked in
        # (Though the regex usually handles it, clean up just in case)
        clause_text = re.sub(r'\s+\d+$', '', clause_text)
        
        clauses.append({
            "clause_number": clause_num,
            "content": clause_text
        })
        
    return clauses

def main():
    print("--------------------------------------------------")
    print(" KHỞI TẠO ĐỒ HỊ TRI THỨC PHÁP LUẬT (LEGAL ONTOLOGY)")
    print("--------------------------------------------------")
    
    if not os.path.exists(PENAL_CODE_JSON):
        print(f"Error: Not found file {PENAL_CODE_JSON}")
        return

    with open(PENAL_CODE_JSON, "r", encoding="utf-8") as f:
        articles = json.load(f)

    nodes = []
    edges = []
    
    # Track created chapter nodes to avoid duplicates
    created_chapters = set()
    
    # Process only common crimes to make a clean, focused model graph for properties & office crimes
    # Focus on articles 168 to 180 (Property crimes) and 353 to 366 (Office crimes)
    target_articles = list(range(168, 181)) + list(range(353, 367))

    for art in articles:
        art_num = art["dieu"]
        
        # For prototype, only graph target articles + base concepts to keep it readable and focused
        if art_num not in target_articles:
            continue
            
        chap_id = f"chapter_{art['chuong']}"
        chap_name = art.get("ten_chuong", f"Chương {art['chuong']}")
        
        # 1. Create Chapter Node
        if chap_id not in created_chapters:
            nodes.append({
                "id": chap_id,
                "label": "Chapter",
                "properties": {
                    "name": chap_name,
                    "code": art["chuong"]
                }
            })
            created_chapters.add(chap_id)
            
        # 2. Create Article Node
        art_id = f"article_{art_num}"
        nodes.append({
            "id": art_id,
            "label": "Article",
            "properties": {
                "name": art["ten_dieu"],
                "article_number": art_num,
                "title": art["ten_dieu"]
            }
        })
        
        # Link Article -> Chapter
        edges.append({
            "source": art_id,
            "target": chap_id,
            "relation": "BELONGS_TO",
            "properties": {}
        })
        
        # 3. Parse and create Clause Nodes
        clauses = parse_clauses(art["noi_dung"])
        for cl in clauses:
            cl_num = cl["clause_number"]
            cl_id = f"article_{art_num}_clause_{cl_num}"
            
            nodes.append({
                "id": cl_id,
                "label": "Clause",
                "properties": {
                    "clause_number": cl_num,
                    "content": cl["content"]
                }
            })
            
            # Link Clause -> Article
            edges.append({
                "source": cl_id,
                "target": art_id,
                "relation": "HAS_CLAUSE",
                "properties": {}
            })
            
            # 4. Extract constituent elements (CrimeElements) from clause contents
            cl_content_lower = cl["content"].lower()
            
            # Check for weapon/force elements
            if any(w in cl_content_lower for w in ["vũ lực", "đe dọa dùng vũ lực", "hung khí", "vũ khí", "dao", "súng"]):
                element_id = "element_violence"
                if not any(n["id"] == element_id for n in nodes):
                    nodes.append({
                        "id": element_id,
                        "label": "CrimeElement",
                        "properties": {"name": "Sử dụng vũ lực hoặc đe dọa vũ lực", "type": "Mặt khách quan"}
                    })
                edges.append({
                    "source": cl_id,
                    "target": element_id,
                    "relation": "CONSTITUTES",
                    "properties": {}
                })

            # Check for stealth/secrecy elements
            if any(w in cl_content_lower for w in ["lén lút", "bí mật", "trộm", "đột nhập"]):
                element_id = "element_stealth"
                if not any(n["id"] == element_id for n in nodes):
                    nodes.append({
                        "id": element_id,
                        "label": "CrimeElement",
                        "properties": {"name": "Hành vi lén lút lấy tài sản", "type": "Mặt khách quan"}
                    })
                edges.append({
                    "source": cl_id,
                    "target": element_id,
                    "relation": "CONSTITUTES",
                    "properties": {}
                })

            # Check for deceit/fraud elements
            if any(w in cl_content_lower for w in ["gian dối", "lừa gạt", "lừa đảo", "giả mạo"]):
                element_id = "element_deceit"
                if not any(n["id"] == element_id for n in nodes):
                    nodes.append({
                        "id": element_id,
                        "label": "CrimeElement",
                        "properties": {"name": "Thủ đoạn gian dối", "type": "Mặt khách quan"}
                    })
                edges.append({
                    "source": cl_id,
                    "target": element_id,
                    "relation": "CONSTITUTES",
                    "properties": {}
                })

            # Check for office/authority elements
            if any(w in cl_content_lower for w in ["lợi dụng chức vụ", "quyền hạn", "chức vụ"]):
                element_id = "element_office"
                if not any(n["id"] == element_id for n in nodes):
                    nodes.append({
                        "id": element_id,
                        "label": "CrimeElement",
                        "properties": {"name": "Lợi dụng chức vụ quyền hạn", "type": "Chủ thể"}
                    })
                edges.append({
                    "source": cl_id,
                    "target": element_id,
                    "relation": "CONSTITUTES",
                    "properties": {}
                })

    # Wrap as graph
    graph_data = {
        "nodes": nodes,
        "edges": edges
    }
    
    # Save graph JSON
    with open(OUTPUT_GRAPH_JSON, "w", encoding="utf-8") as f:
        json.dump(graph_data, f, ensure_ascii=False, indent=2)
        
    print(f"-> Tạo thành công Đồ thị tri thức Pháp luật (Legal Ontology Graph)!")
    print(f"   Đường dẫn: {OUTPUT_GRAPH_JSON}")
    print(f"   Tổng số đỉnh (Nodes): {len(nodes)}")
    print(f"   Tổng số cạnh (Edges): {len(edges)}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    main()
