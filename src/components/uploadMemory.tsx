import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ImagePlus, Loader2, CheckCircle2, X, Film } from "lucide-react";
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
    Swal.fire({
      title: "Guardando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

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
        title: "¡Publicado!",
        timer: 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        setFiles([]);
        setPreviews([]);
        setDescription("");
        setIsSuccess(false);
        if (onComplete) onComplete();
      }, 1500);
    } catch (error) {
      Swal.fire("Error", "No se pudo subir", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
      <form onSubmit={handleUpload} className="space-y-6 text-left">
        <h2 className="text-2xl font-serif italic text-slate-800 text-center text-perro">
          Nuevo Momento
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
            ¿Cuándo fue?
          </label>
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="p-4 bg-slate-50 rounded-2xl outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoria(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                categoria === cat.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-400 border-slate-100"
              }`}
            >
              {cat.icon} {cat.id}
            </button>
          ))}
        </div>

        <div className="relative min-h-[140px] border-2 border-dashed border-slate-100 rounded-[32px] flex items-center justify-center p-6">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          {previews.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 shadow-md rounded-2xl overflow-hidden border-2 border-white bg-black"
                >
                  {p.tipo === "video" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={20} className="text-white" />
                    </div>
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
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-red-500 z-20"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <ImagePlus className="mx-auto mb-1" />
              <p className="text-[10px] font-black uppercase">
                Subir fotos/videos
              </p>
            </div>
          )}
        </div>

        <textarea
          placeholder="Cuéntame la historia..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-6 bg-slate-50 rounded-[32px] outline-none italic resize-none"
          rows={3}
        />

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className={`w-full py-5 rounded-[24px] font-black uppercase text-[12px] tracking-[0.2em] shadow-xl transition-all flex justify-center items-center gap-2 ${
            isSuccess ? "bg-green-500 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {uploading ? (
            <Loader2 className="animate-spin" />
          ) : isSuccess ? (
            <>
              <CheckCircle2 size={20} /> ¡Subido!
            </>
          ) : (
            "Publicar Recuerdo"
          )}
        </button>
      </form>
    </div>
  );
};
