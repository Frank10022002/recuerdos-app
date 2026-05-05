import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import {
  Clock,
  X,
  CalendarDays,
  Trash2,
  Filter,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Heart,
  Laugh,
  Flame,
} from "lucide-react";

interface Reaccion {
  uid: string;
  nombre: string;
  emoji: string;
}

interface Memoria {
  id: string;
  urls: string[];
  descripcion: string;
  tipo: "foto" | "video";
  fecha: string;
  autor?: string;
  autorFoto?: string;
  categoria?: string;
  reacciones?: Reaccion[];
}

export const Gallery: React.FC = () => {
  const [memorias, setMemorias] = useState<Memoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Memoria | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [filtro, setFiltro] = useState("Todos");

  const categoriasFiltro = [
    { id: "Todos", icon: "🌈" },
    { id: "Cita", icon: "🌹" },
    { id: "Viaje", icon: "✈️" },
    { id: "Aniversario", icon: "✨" },
    { id: "Comida", icon: "🍕" },
    { id: "Recuerdo", icon: "📸" },
  ];

  useEffect(() => {
    const q = query(collection(db, "memorias"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        urls: doc.data().urls || [doc.data().url],
      })) as Memoria[];
      setMemorias(datos);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleBack = () => {
      if (selected) setSelected(null);
    };
    if (selected) {
      window.history.pushState({ modalOpen: true }, "");
      window.addEventListener("popstate", handleBack);
    }
    return () => window.removeEventListener("popstate", handleBack);
  }, [selected]);

  const handleReaccionar = async (memoriaId: string, emoji: string) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const memoria = memorias.find((m) => m.id === memoriaId);
    if (!memoria) return;
    const reaccionExistente = memoria.reacciones?.find(
      (r) => r.uid === user.uid
    );
    const docRef = doc(db, "memorias", memoriaId);
    if (reaccionExistente) {
      await updateDoc(docRef, { reacciones: arrayRemove(reaccionExistente) });
      if (reaccionExistente.emoji === emoji) return;
    }
    await updateDoc(docRef, {
      reacciones: arrayUnion({
        uid: user.uid,
        nombre: user.displayName || "Usuario",
        emoji,
      }),
    });
    if (emoji === "❤️")
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: "¿Borrar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });
    if (res.isConfirmed) await deleteDoc(doc(db, "memorias", id));
  };

  const obtenerAlmanaque = () => {
    const almanaque: any = {};
    const filtradas =
      filtro === "Todos"
        ? memorias
        : memorias.filter((m) => m.categoria === filtro);
    filtradas.forEach((m) => {
      const d = new Date(m.fecha.replace(/-/g, "/").replace("T", " "));
      const anio = d.getFullYear(),
        mes = d.toLocaleString("es-ES", { month: "long" }).toUpperCase(),
        dia = d.getDate();
      if (!almanaque[anio]) almanaque[anio] = {};
      if (!almanaque[anio][mes]) almanaque[anio][mes] = {};
      if (!almanaque[anio][mes][dia])
        almanaque[anio][mes][dia] = {
          nombre: d.toLocaleString("es-ES", { weekday: "long" }),
          fotos: [],
        };
      almanaque[anio][mes][dia].fotos.push(m);
    });
    return almanaque;
  };

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400 italic">
        Abriendo el baúl...
      </div>
    );
  const datosCrono = obtenerAlmanaque();

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-10 overflow-x-auto py-4 no-scrollbar">
        <Filter size={16} className="text-slate-300" />
        {categoriasFiltro.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltro(cat.id)}
            className={`px-5 py-2 rounded-full text-[10px] font-black border ${
              filtro === cat.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-400 border-slate-100"
            }`}
          >
            {cat.icon} {cat.id}
          </button>
        ))}
      </div>

      {Object.keys(datosCrono)
        .sort((a, b) => Number(b) - Number(a))
        .map((anio) => (
          <div key={anio} className="mt-12">
            <h2 className="text-5xl font-black text-slate-100 mb-8">{anio}</h2>
            {Object.keys(datosCrono[anio]).map((mes) => (
              <div key={mes} className="mb-10 pl-6 border-l-2 border-pink-50">
                <h3 className="text-pink-400 font-bold mb-6 italic">{mes}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {Object.keys(datosCrono[anio][mes]).map((dia) =>
                    datosCrono[anio][mes][dia].fotos.map((m: Memoria) => (
                      <motion.div
                        key={m.id}
                        layoutId={m.id}
                        onClick={() => setSelected(m)}
                        className="bg-white rounded-[40px] overflow-hidden shadow-xl cursor-pointer"
                      >
                        <img
                          src={m.urls[0]}
                          className="aspect-[4/5] object-cover w-full"
                        />
                        <div className="p-4 flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">
                            {dia} {mes}
                          </span>
                          <Clock size={12} className="text-slate-200" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
            />
            <motion.div
              layoutId={selected.id}
              className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="md:w-2/3 bg-black flex items-center relative">
                <img
                  src={selected.urls[currentImgIndex]}
                  className="w-full object-contain"
                />
                {selected.urls.length > 1 && (
                  <div className="absolute inset-x-4 flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex((i) =>
                          i > 0 ? i - 1 : selected.urls.length - 1
                        );
                      }}
                      className="p-2 bg-white/20 rounded-full text-white"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex((i) =>
                          i < selected.urls.length - 1 ? i + 1 : 0
                        );
                      }}
                      className="p-2 bg-white/20 rounded-full text-white"
                    >
                      <ChevronRight />
                    </button>
                  </div>
                )}
              </div>
              <div className="md:w-1/3 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-pink-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {selected.fecha.split("T")[0]}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-slate-300"
                  >
                    <X />
                  </button>
                </div>
                <p className="text-slate-600 italic mb-8 flex-1">
                  "{selected.descripcion}"
                </p>
                <div className="flex gap-4 border-t pt-6">
                  <button onClick={() => handleReaccionar(selected.id, "❤️")}>
                    <Heart className="text-pink-500" />
                  </button>
                  <button onClick={() => handleReaccionar(selected.id, "😂")}>
                    <Laugh className="text-yellow-500" />
                  </button>
                  <button onClick={() => handleReaccionar(selected.id, "🔥")}>
                    <Flame className="text-orange-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="ml-auto text-slate-200 hover:text-red-400"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="mt-4 text-[10px] font-bold text-slate-300 uppercase">
                  {selected.reacciones?.length
                    ? `Reaccionado por: ${selected.reacciones
                        .map((r) => r.nombre)
                        .join(", ")}`
                    : "Sin reacciones"}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
