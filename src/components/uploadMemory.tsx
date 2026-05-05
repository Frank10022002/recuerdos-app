import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ImagePlus, Loader2, X, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

export const UploadMemory: React.FC<{ onComplete?: () => void }> = ({
  onComplete,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [categoria, setCategoria] = useState("Cita");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);

      // Generar vistas previas
      const newPreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviews(newPreviews);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0 || !auth.currentUser) return;

    setUploading(true);
    Swal.fire({
      title: "Guardando...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const urls: string[] = [];
      for (const file of files) {
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
        if (data.secure_url) urls.push(data.secure_url);
      }

      await addDoc(collection(db, "memorias"), {
        urls,
        descripcion: description,
        tipo: files[0].type.startsWith("video/") ? "video" : "foto",
        fecha: new Date().toISOString(),
        autor: auth.currentUser.displayName || "Usuario",
        autorFoto: auth.currentUser.photoURL || "",
        categoria: categoria,
        reacciones: [],
      });

      Swal.fire({
        title: "¡Subido!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setFiles([]);
      setPreviews([]);
      setDescription("");
      if (onComplete) onComplete();
    } catch (error) {
      Swal.fire("Error", "Hubo un problema al subir", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
      <form onSubmit={handleUpload} className="space-y-6">
        <h2 className="text-2xl font-serif italic text-slate-800 text-center">
          Nuevo Recuerdo
        </h2>

        {/* Dropzone con Previos */}
        <div className="relative min-h-[160px] border-2 border-dashed border-slate-100 rounded-3xl p-4 flex flex-wrap gap-2 items-center justify-center hover:bg-pink-50/30 transition-all cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />

          {previews.length > 0 ? (
            previews.map((src, i) => (
              <img
                key={i}
                src={src}
                className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-sm"
                alt="preview"
              />
            ))
          ) : (
            <div className="text-center">
              <ImagePlus className="mx-auto text-slate-300" size={32} />
              <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">
                Toca para elegir varias fotos
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="flex-1 p-4 bg-slate-50 rounded-2xl outline-none text-xs font-bold text-slate-500 appearance-none border border-transparent focus:border-pink-100"
          >
            <option value="Cita">🌹 Cita</option>
            <option value="Viaje">✈️ Viaje</option>
            <option value="Comida">🍕 Comida</option>
            <option value="Momentos">📸 Momentos</option>
          </select>
        </div>

        <textarea
          placeholder="Escribe algo lindo..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-5 bg-slate-50 rounded-3xl outline-none resize-none text-slate-600 italic border border-transparent focus:border-pink-100"
          rows={3}
        />

        <button
          type="submit"
          disabled={files.length === 0 || uploading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-slate-200 active:scale-95 transition-transform disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Publicar Recuerdo"
          )}
        </button>
      </form>
    </div>
  );
};
