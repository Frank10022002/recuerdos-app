import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

interface UploadMemoryProps {
  onComplete?: () => void;
}

export const UploadMemory: React.FC<UploadMemoryProps> = ({ onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [manualDate, setManualDate] = useState(
    new Date().toLocaleDateString("sv-SE")
  );
  const [categoria, setCategoria] = useState("Cita");

  const categorias = [
    { id: "Todos", icon: "🌈" },
    { id: "Cita", icon: "🌹" },
    { id: "Viaje", icon: "✈️" },
    { id: "Aniversario", icon: "✨" },
    { id: "Comida", icon: "🍕" },
    { id: "Recuerdo", icon: "📸" },
    { id: "Momentos Random", icon: "🎲" },
    { id: "Gatos", icon: "🐱" },
    { id: "Perros", icon: "🐶" },
  ];

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return;

    setUploading(true);
    Swal.fire({
      title: "Guardando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "baul_recuerdos");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/duq6yy1su/auto/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();

      await addDoc(collection(db, "memorias"), {
        url: data.secure_url,
        descripcion: description,
        tipo: file.type.startsWith("video/") ? "video" : "foto",
        fecha: `${manualDate}T${new Date().toLocaleTimeString("en-GB")}`,
        autor: auth.currentUser.displayName || "Especial",
        autorFoto: auth.currentUser.photoURL || "",
        categoria: categoria,
      });

      Swal.fire({
        title: "¡Listo!",
        text: "Recuerdo guardado",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { popup: "rounded-[32px]" },
      });
      if (onComplete) onComplete();
    } catch (error) {
      Swal.fire("Error", "No se pudo subir", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-100">
      <form onSubmit={handleUpload} className="space-y-6 text-left">
        <h2 className="text-2xl font-serif italic text-slate-800">
          Nuevo Momento
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
            ¿Cuándo fue?
          </label>
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="p-4 bg-slate-50 rounded-2xl outline-none"
          />
        </div>

        {/* SELECTOR DE CATEGORÍAS */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
            ¿Qué tipo de momento fue?
          </label>
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoria(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 ${
                  categoria === cat.id
                    ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-100 scale-105"
                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-white"
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                {cat.id}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-40 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {file ? (
            <CheckCircle2 className="text-green-500" />
          ) : (
            <ImagePlus className="text-slate-300" />
          )}
          <p className="text-xs font-bold text-slate-400 mt-2">
            {file ? file.name : "Seleccionar Archivo"}
          </p>
        </div>

        <textarea
          placeholder="Cuéntame la historia..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none resize-none"
          rows={3}
        />

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
        >
          {uploading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Guardar en el Baúl"
          )}
        </button>
      </form>
    </div>
  );
};
