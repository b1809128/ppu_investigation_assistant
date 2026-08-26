#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    # Locate virtualenv python
    venv_python = os.path.join(root_dir, "venv", "bin", "python3")
    if not os.path.exists(venv_python):
        venv_python = os.path.join(root_dir, "venv", "bin", "python")
        if not os.path.exists(venv_python):
            venv_python = "python3" # Fallback to global python
            
    print("==========================================================")
    print(" KHỞI CHẠY ĐỒNG THỜI HỆ THỐNG TRỢ LÝ ĐIỀU TRA (DEV MODE)")
    print("==========================================================")

    # 1. Start Backend FastAPI Server
    backend_cmd = [venv_python, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    print(f"-> Khởi động Backend FastAPI tại http://localhost:8000/")
    print(f"   Lệnh: {' '.join(backend_cmd)}")
    
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=root_dir,
        stdout=None,
        stderr=None
    )

    # Give backend a moment to start
    time.sleep(1.5)

    # 2. Start Frontend Vite Dev Server
    frontend_cmd = ["npm", "run", "dev"]
    print(f"-> Khởi động Frontend Vite tại http://localhost:5173/")
    print(f"   Lệnh: {' '.join(frontend_cmd)}")
    
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir,
        stdout=None,
        stderr=None
    )

    print("\n[HỆ THỐNG ĐÃ SẴN SÀNG]")
    print("- Nhấn Ctrl+C để dừng đồng thời cả hai server.")
    print("----------------------------------------------------------\n")

    # Monitor processes and handle clean exit
    try:
        while True:
            # Check if any process has exited unexpectedly
            back_status = backend_proc.poll()
            front_status = frontend_proc.poll()
            
            if back_status is not None:
                print(f"\n[CẢNH BÁO] Backend tự dừng với mã lỗi: {back_status}")
                break
            if front_status is not None:
                print(f"\n[CẢNH BÁO] Frontend tự dừng với mã lỗi: {front_status}")
                break
                
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n-> Nhận tín hiệu dừng (Ctrl+C). Đang tắt các tiến trình...")
    finally:
        # Gracefully terminate frontend
        if frontend_proc.poll() is None:
            print("-> Đang dừng Frontend...")
            frontend_proc.terminate()
            try:
                frontend_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                frontend_proc.kill()
                
        # Gracefully terminate backend
        if backend_proc.poll() is None:
            print("-> Đang dừng Backend...")
            backend_proc.terminate()
            try:
                backend_proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                backend_proc.kill()
                
        print("\n[ĐÃ TẮT THÀNH CÔNG] Toàn bộ hệ thống đã được giải phóng.")

if __name__ == "__main__":
    main()
