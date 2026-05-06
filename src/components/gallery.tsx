import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
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
} from "lucide-react";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface Memoria {
  id: string;
  urls?: string[];
  url?: string; // Compatibilidad
  descripcion: string;
  tipo: "foto" | "video";
  fecha: string;
  autor?: string;
  autorFoto?: string;
  categoria?: string;
}

export const Gallery: React.FC = () => {
  const [memorias, setMemorias] = useState<Memoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Memoria | null>(null);
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
      setMemorias(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Memoria[]
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Bug Fix: 2do click y Botón atrás
  useEffect(() => {
    if (!selected) return;
    window.history.pushState({ modalOpen: true }, "");
    const handlePopState = () => setSelected(null);
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.modalOpen) window.history.back();
    };
  }, [selected]);

  // Magic Confetti
  useEffect(() => {
    const abrirAzar = () => {
      if (memorias.length > 0) {
        const random = memorias[Math.floor(Math.random() * memorias.length)];
        setSelected(random);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    };
    window.addEventListener("magicMemory", abrirAzar);
    return () => window.removeEventListener("magicMemory", abrirAzar);
  }, [memorias]);

  const handleFullEdit = async (m: Memoria) => {
    const { value: formValues } = await Swal.fire({
      title: "Editar Recuerdo",
      html: `<input id="swal-desc" class="swal2-input" value="${m.descripcion}">`,
      showCancelButton: true,
      preConfirm: () => ({
        descripcion: (document.getElementById("swal-desc") as HTMLInputElement)
          .value,
      }),
    });
    if (formValues) {
      await updateDoc(doc(db, "memorias", m.id), formValues);
      Swal.fire("¡Actualizado!", "", "success");
    }
  };

  const parsearFecha = (f: string) => {
    const d = new Date(f.replace(/-/g, "/").replace("T", " "));
    return isNaN(d.getTime()) ? new Date() : d;
  };

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400 italic">
        Abriendo el baúl...
      </div>
    );

  return (
    <div className="w-full p-4">
      {/* FILTROS */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-4 no-scrollbar">
        <Filter size={16} className="text-slate-400 mt-2" />
        {categoriasFiltro.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltro(cat.id)}
            className={`px-4 py-2 rounded-full text-[10px] font-black border shrink-0 transition-all ${
              filtro === cat.id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-400"
            }`}
          >
            {cat.icon} {cat.id}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {memorias
          .filter((m) => filtro === "Todos" || m.categoria === filtro)
          .map((m) => (
            <motion.div
              key={m.id}
              layoutId={m.id}
              className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50 relative group"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFullEdit(m);
                }}
                className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil size={14} className="text-slate-600" />
              </button>
              <div onClick={() => setSelected(m)} className="cursor-pointer">
                <img
                  src={m.urls ? m.urls[0] : m.url}
                  className="w-full aspect-square object-cover"
                  alt="recuerdo"
                />
                <div className="p-4 italic text-slate-500 text-sm truncate">
                  "{m.descripcion}"
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* MODAL DETALLE */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div
              layoutId={selected.id}
              className="relative bg-white w-full max-w-5xl md:rounded-[40px] overflow-hidden flex flex-col md:flex-row h-full md:h-auto max-h-[90vh]"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-[110] p-2 bg-slate-100 rounded-full text-slate-500"
              >
                <X />
              </button>

              {/* CARRUSEL */}
              <div className="w-full md:w-2/3 bg-black relative flex items-center justify-center">
                <Swiper
                  modules={[Pagination, Navigation]}
                  pagination={{ clickable: true }}
                  navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
                  className="w-full h-full"
                >
                  {(selected.urls || [selected.url]).map((u, i) => (
                    <SwiperSlide key={i}>
                      <img src={u} className="w-full h-full object-contain" />
                    </SwiperSlide>
                  ))}
                  <button className="prev-btn absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 rounded-full text-white">
                    <ChevronLeft />
                  </button>
                  <button className="next-btn absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 rounded-full text-white">
                    <ChevronRight />
                  </button>
                </Swiper>
              </div>

              {/* INFO */}
              <div className="w-full md:w-1/3 p-8 flex flex-col gap-6 overflow-y-auto bg-white">
                <div>
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">
                    #{selected.categoria}
                  </span>
                  <div className="flex items-center gap-2 mt-4 text-slate-800 text-xl font-serif italic">
                    <CalendarDays size={18} />{" "}
                    {parsearFecha(selected.fecha).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-1">
                    <Clock size={14} />{" "}
                    {parsearFecha(selected.fecha).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <p className="text-slate-600 text-lg leading-relaxed italic flex-1">
                  "{selected.descripcion}"
                </p>
                <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <img
                      src={selected.autorFoto}
                      className="w-6 h-6 rounded-full"
                      alt="autor"
                    />
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {selected.autor}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      deleteDoc(doc(db, "memorias", selected.id));
                      setSelected(null);
                    }}
                    className="p-2 text-red-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
