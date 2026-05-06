import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ImagePlus, Loader2, CheckCircle2, X } from "lucide-react";
import Swal from "sweetalert2";

interface UploadMemoryProps {
  onComplete?: () => void;
}

export const UploadMemory: React.FC<UploadMemoryProps> = ({ onComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [manualDate, setManualDate] = useState(
    new Date().toLocaleDateString("sv-SE")
  );
  const [categoria, setCategoria] = useState("Cita");

  const categorias = [
    { id: "Cita", icon: "🌹" },
    { id: "Viaje", icon: "✈️" },
    { id: "Aniversario", icon: "✨" },
    { id: "Comida", icon: "🍕" },
    { id: "Recuerdo", icon: "📸" },
    { id: "Momentos Random", icon: "🎲" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      const newPreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
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
    Swal.fire({
      title: "Guardando en el baúl...",
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
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await res.json();
        return data.secure_url;
      });

      const urls = await Promise.all(uploadPromises);

      await addDoc(collection(db, "memorias"), {
        urls,
        descripcion: description,
        tipo: files[0].type.startsWith("video/") ? "video" : "foto",
        fecha: `${manualDate}T${new Date().toLocaleTimeString("en-GB")}`,
        autor: auth.currentUser.displayName || "Especial",
        autorFoto: auth.currentUser.photoURL || "",
        categoria,
      });

      Swal.fire({
        icon: "success",
        title: "¡Listo!",
        timer: 1500,
        showConfirmButton: false,
      });
      setFiles([]);
      setPreviews([]);
      setDescription("");
      if (onComplete) onComplete();
    } catch (error) {
      Swal.fire("Error", "No se pudo subir", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
      <form onSubmit={handleUpload} className="space-y-6 text-left">
        <h2 className="text-2xl font-serif italic text-slate-800">
          Nuevo Momento
        </h2>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
            ¿Cuándo fue?
          </label>
          <input
            type="date"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="p-4 bg-slate-50 rounded-2xl outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoria(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                categoria === cat.id
                  ? "bg-pink-500 text-white border-pink-500"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              {cat.icon} {cat.id}
            </button>
          ))}
        </div>

        <div className="relative min-h-[120px] border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center p-4">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          {previews.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {previews.map((src, i) => (
                <div key={i} className="relative w-16 h-16 group">
                  <img
                    src={src}
                    className="w-full h-full object-cover rounded-xl border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 bg-white rounded-full shadow-md p-1 text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <ImagePlus className="mx-auto text-slate-300" />
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                Añadir fotos/videos
              </p>
            </div>
          )}
        </div>

        <textarea
          placeholder="La historia..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none italic"
          rows={3}
        />

        <button
          type="submit"
          disabled={uploading || files.length === 0}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex justify-center items-center"
        >
          {uploading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <CheckCircle2 size={18} className="mr-2" /> Guardar Momento
            </>
          )}
        </button>
      </form>
    </div>
  );
};
