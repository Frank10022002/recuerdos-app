import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import {
  ImagePlus,
  Loader2,
  CheckCircle2,
  X,
  Clapperboard, // Reemplazó a Film
  Calendar, // Reemplazó a CalendarDays
  Sparkles,
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
        title: "¡Momento guardado!",
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
    <div className="max-w-md mx-auto bg-white rounded-[50px] shadow-[0_30px_100px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-50">
      <div className="bg-gradient-to-br from-pink-500 to-rose-400 p-8 text-center relative">
        <Sparkles className="absolute top-2 right-2 text-white/20" size={40} />
        <h2 className="text-white font-black text-2xl tracking-tight relative z-10">
          Nuevo Momento
        </h2>
        <p className="text-pink-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-80 relative z-10">
          Guardar un recuerdo
        </p>
      </div>

      <form onSubmit={handleUpload} className="p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={auth.currentUser?.photoURL || ""}
              className="w-14 h-14 rounded-full border-4 border-pink-50 shadow-sm"
              alt="profile"
            />
            <div>
              <p className="font-black text-slate-800 text-xs uppercase tracking-tighter">
                {auth.currentUser?.displayName}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Calendar size={10} className="text-pink-500" />{" "}
                {/* USO DE CALENDAR */}
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="text-[10px] font-black text-pink-500 bg-pink-50/50 px-2 py-1 rounded-lg border-none outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-20"
          />
          <div
            className={`min-h-[200px] border-2 border-dashed rounded-[40px] transition-all flex flex-col items-center justify-center p-6 ${
              previews.length > 0
                ? "border-pink-200 bg-pink-50/20"
                : "border-slate-200 bg-slate-50/50 group-hover:bg-slate-100"
            }`}
          >
            {previews.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 w-full">
                {previews.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-[30px] overflow-hidden shadow-xl border-4 border-white"
                  >
                    {p.tipo === "video" ? (
                      <video
                        src={p.url}
                        className="w-full h-full object-cover"
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
                      className="absolute top-2 right-2 bg-white rounded-full p-1.5 text-red-500 shadow-md z-30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-3 text-pink-400">
                  <ImagePlus size={32} />
                  <Clapperboard size={32} /> {/* USO DE CLAPPERBOARD */}
                </div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
                  Añadir fotos o videos
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 text-left">
            Categoría
          </p>
          <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoria(cat.id)}
                className={`px-5 py-3 rounded-[20px] text-[11px] font-black border shrink-0 transition-all ${
                  categoria === cat.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                    : "bg-white text-slate-400 border-slate-100"
                }`}
              >
                {cat.icon} {cat.id}
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder="Escribe la historia detrás de este momento..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-6 bg-slate-50 rounded-[35px] outline-none italic text-slate-600 border-2 border-transparent focus:border-pink-100 focus:bg-white transition-all resize-none text-sm"
          rows={4}
        />

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className={`w-full py-6 rounded-[30px] font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl transition-all flex justify-center items-center gap-3 ${
            isSuccess ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {uploading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={20} /> Publicado
            </>
          ) : (
            "Guardar Recuerdo"
          )}
        </button>
      </form>
    </div>
  );
};
