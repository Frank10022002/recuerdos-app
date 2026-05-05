import React, { useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

export const UploadMemory: React.FC<{ onComplete?: () => void }> = ({
  onComplete,
}) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [categoria, setCategoria] = useState("Cita");
  const [manualDate, setManualDate] = useState(
    new Date().toLocaleDateString("sv-SE")
  );

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || !auth.currentUser) return;

    setUploading(true);
    Swal.fire({
      title: "Guardando momento...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const urls: string[] = [];
      // Subida secuencial a Cloudinary
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
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
        fecha: `${manualDate}T${new Date().toLocaleTimeString("en-GB")}`,
        autor: auth.currentUser.displayName || "Especial",
        autorFoto: auth.currentUser.photoURL || "",
        categoria: categoria,
        reacciones: [],
      });

      Swal.fire({
        title: "¡Listo!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setDescription("");
      setFiles(null);
      if (onComplete) onComplete();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo subir las fotos", "error");
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

        <div className="relative h-40 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center hover:bg-pink-50 transition-colors cursor-pointer">
          <input
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {files ? (
            <CheckCircle2 className="text-green-500" />
          ) : (
            <ImagePlus className="text-slate-300" />
          )}
          <p className="text-xs font-bold text-slate-400 mt-2">
            {files ? `${files.length} seleccionados` : "Subir fotos o videos"}
          </p>
        </div>

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm font-bold text-slate-500"
        >
          <option value="Cita">🌹 Cita</option>
          <option value="Viaje">✈️ Viaje</option>
          <option value="Comida">🍕 Comida</option>
          <option value="Gatos">🐱 Gatos</option>
        </select>

        <input
          type="date"
          value={manualDate}
          onChange={(e) => setManualDate(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none text-sm"
        />

        <textarea
          placeholder="Cuéntame la historia..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-4 bg-slate-50 rounded-2xl outline-none resize-none"
          rows={3}
        />

        <button
          type="submit"
          disabled={!files || uploading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex justify-center items-center gap-2 transition-transform active:scale-95"
        >
          {uploading ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Guardar en el Baúl"
          )}
        </button>
      </form>
    </div>
  );
};
