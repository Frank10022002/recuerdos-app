import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import {
  ImagePlus,
  Loader2,
  CheckCircle2,
  X,
  Film,
  CalendarDays,
} from "lucide-react";
import Swal from "sweetalert2";

interface UploadMemoryProps {
  onComplete?: () => void;
}

export const UploadMemory: React.FC<UploadMemoryProps> = ({ onComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; tipo: string }[]>([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [manualDate, setManualDate] = useState(
    new Date().toLocaleDateString("sv-SE")
  );
  const [categoria, setCategoria] = useState("Cita");

  const categorias = [
    { id: "Cita", icon: "🌹" },
    { id: "Viaje", icon: "✈️" },
    { id: "Diversión", icon: "😂" },
    { id: "Aniversario", icon: "✨" },
    { id: "Comida", icon: "🍕" },
    { id: "Perro", icon: "🐶" },
    { id: "Gato", icon: "🐱" },
    { id: "Recuerdo", icon: "📸" },
    { id: "Momentos Random", icon: "🎲" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      const newPreviews = selectedFiles.map((file) => ({
        url: URL.createObjectURL(file),
        tipo: file.type.startsWith("video/") ? "video" : "foto",
      }));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !auth.currentUser) return;
    setUploading(true);
    setIsSuccess(false);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "baul_recuerdos");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/duq6yy1su/auto/upload",
          { method: "POST", body: formData }
        );
        const data = await res.json();
        return {
          url: data.secure_url,
          tipo: file.type.startsWith("video/") ? "video" : "foto",
        };
      });

      const archivosSubidos = await Promise.all(uploadPromises);

      await addDoc(collection(db, "memorias"), {
        archivos: archivosSubidos,
        descripcion: description,
        fecha: `${manualDate}T${new Date().toLocaleTimeString("en-GB")}`,
        autor: auth.currentUser.displayName || "Especial",
        autorFoto: auth.currentUser.photoURL || "",
        categoria,
        reacciones: {},
      });

      setIsSuccess(true);
      Swal.fire({
        icon: "success",
        title: "¡Guardado!",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        setFiles([]);
        setPreviews([]);
        setDescription("");
        setIsSuccess(false);
        if (onComplete) onComplete();
      }, 2000);
    } catch (error) {
      Swal.fire("Error", "No se pudo subir", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-50 mb-10">
      <div className="bg-pink-500 p-4 text-center">
        <h2 className="text-white font-bold text-lg tracking-tight">
          Nuevo Momento
        </h2>
      </div>

      <form onSubmit={handleUpload} className="p-6 space-y-4 text-left">
        <div className="flex items-center gap-3">
          <img
            src={auth.currentUser?.photoURL || ""}
            className="w-10 h-10 rounded-full border border-pink-100 shadow-sm"
            alt="profile"
          />
          <div>
            <p className="font-black text-slate-800 text-xs uppercase tracking-tighter leading-none">
              {auth.currentUser?.displayName}
            </p>
            <div className="flex items-center text-slate-400 text-[9px] font-bold uppercase gap-1 mt-1">
              <CalendarDays size={10} />
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer hover:text-pink-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="relative border border-dashed border-slate-200 rounded-[24px] p-4 bg-slate-50/50 hover:bg-slate-50 transition-all group">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-20"
          />

          {previews.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 relative z-10 justify-items-center">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-xl overflow-hidden shadow bg-black border border-white"
                >
                  {p.tipo === "video" ? (
                    <video
                      src={p.url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={p.url}
                      className="w-full h-full object-cover"
                      alt="prev"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-0 right-0 bg-white rounded-full p-0.5 text-red-500 shadow-lg z-30"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-slate-300">
              <div className="flex justify-center gap-3 mb-1">
                <ImagePlus size={24} />
                <Film size={24} /> {/* AQUÍ SE USA FILM */}
              </div>
              <p className="text-slate-400 font-bold text-[10px] tracking-tight uppercase">
                Añadir recuerdos
              </p>
            </div>
          )}
        </div>

        <div className="flex overflow-x-auto gap-1 no-scrollbar py-1">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoria(cat.id)}
              className={`px-3 py-1 rounded-full text-[9px] font-black border shrink-0 transition-all ${
                categoria === cat.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-400 border-slate-100"
              }`}
            >
              {cat.icon} {cat.id}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Escribe tu historia..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-[16px] outline-none italic text-slate-600 border-none resize-none text-xs"
          rows={3}
        />

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className={`w-full py-4 rounded-[16px] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all flex justify-center items-center gap-2 active:scale-95 ${
            isSuccess ? "bg-green-600 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {uploading ? (
            <Loader2 className="animate-spin" />
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={16} /> Publicado
            </>
          ) : (
            "Guardar Momento"
          )}
        </button>
      </form>
    </div>
  );
};
