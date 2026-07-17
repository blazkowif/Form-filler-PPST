import tkinter as tk
from tkinter import filedialog
import fitz  # PyMuPDF
from PIL import Image, ImageTk

class PDFCoordinateTool:
    def __init__(self, root):
        self.root = root
        self.root.title("Alat Pencari Koordinat PDF UMS")
        
        # Butang untuk memuat naik PDF
        self.btn = tk.Button(root, text="Buka Fail PDF", font=("Arial", 12), command=self.load_pdf, bg="lightblue")
        self.btn.pack(pady=5)

        # Label untuk memaparkan koordinat X dan Y
        self.coord_label = tk.Label(root, text="Sila buka fail PDF dan klik pada mana-mana garisan", font=("Arial", 14, "bold"), fg="red")
        self.coord_label.pack(pady=5)

        # Kanvas untuk memaparkan imej PDF
        self.canvas = tk.Canvas(root, cursor="cross", bg="gray")
        self.canvas.pack()
        
        # Kesan klik tetikus (Klik Kiri)
        self.canvas.bind("<Button-1>", self.on_click)

        self.pdf_height = 0

    def load_pdf(self):
        file_path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
        if not file_path: return
        
        # Buka PDF menggunakan PyMuPDF
        doc = fitz.open(file_path)
        page = doc[0] # Ambil muka surat pertama
        
        # Dapatkan saiz sebenar PDF dalam mata (points)
        self.pdf_height = page.rect.height
        width = page.rect.width
        
        self.canvas.config(width=width, height=self.pdf_height)
        
        # Tukar PDF ke Imej pada resolusi tepat (72 DPI = 1 point)
        pix = page.get_pixmap(dpi=72)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        self.tk_img = ImageTk.PhotoImage(img)
        
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.tk_img)

    def on_click(self, event):
        # Koordinat dalam tetingkap Tkinter (Dari atas ke bawah)
        tk_x = event.x
        tk_y = event.y
        
        # Tukar ke Koordinat ReportLab (Dari bawah ke atas)
        rl_x = tk_x
        rl_y = self.pdf_height - tk_y
        
        # Kemaskini Label
        self.coord_label.config(text=f"Masukkan dalam kod Colab anda: X={rl_x:.1f}, Y={rl_y:.1f}")
        
        # Lukis titik merah sebagai penanda tempat anda klik
        r = 3
        self.canvas.create_oval(tk_x-r, tk_y-r, tk_x+r, tk_y+r, fill="red", outline="red")
        
        # Tulis nilai di atas kanvas
        self.canvas.create_text(tk_x + 8, tk_y - 8, text=f"({rl_x:.1f}, {rl_y:.1f})", fill="blue", font=("Arial", 10, "bold"), anchor=tk.W)

if __name__ == "__main__":
    root = tk.Tk()
    app = PDFCoordinateTool(root)
    root.mainloop()