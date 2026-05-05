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
  url?: string; // Para compatibilidad con fotos antiguas
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
    { id: "Diversión", icon: "😂" },
    { id: "Aniversario", icon: "✨" },
    { id: "Comida", icon: "🍕" },
    { id: "Recuerdo", icon: "📸" },
    { id: "Gatos", icon: "🐱" },
  ];

  useEffect(() => {
    const q = query(collection(db, "memorias"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Si no tiene el array 'urls', creamos uno con la 'url' antigua
          urls: data.urls || (data.url ? [data.url] : []),
        };
      }) as Memoria[];
      setMemorias(datos);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Control del botón atrás para evitar parpadeos
  useEffect(() => {
    const handleBack = () => {
      if (selected) {
        setSelected(null);
        setCurrentImgIndex(0);
      }
    };

    if (selected) {
      window.history.pushState({ modalOpen: true }, "");
      window.addEventListener("popstate", handleBack);
    }

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [selected]);

  const cerrarModal = () => {
    if (window.history.state?.modalOpen) {
      window.history.back();
    } else {
      setSelected(null);
      setCurrentImgIndex(0);
    }
  };

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

    const nuevaReaccion = {
      uid: user.uid,
      nombre: user.displayName || "Usuario",
      emoji,
    };
    await updateDoc(docRef, { reacciones: arrayUnion(nuevaReaccion) });

    if (emoji === "❤️") {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    }
  };

  const parsearFechaSegura = (fechaStr: string) => {
    if (!fechaStr) return new Date();
    const d = new Date(fechaStr.replace(/-/g, "/").replace("T", " "));
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const obtenerAlmanaque = () => {
    const almanaque: any = {};
    const filtradas =
      filtro === "Todos"
        ? memorias
        : memorias.filter((m) => m.categoria === filtro);

    filtradas.forEach((m) => {
      const d = parsearFechaSegura(m.fecha);
      const anio = d.getFullYear();
      const mes = d.toLocaleString("es-ES", { month: "long" }).toUpperCase();
      const dia = d.getDate();

      if (!almanaque[anio]) almanaque[anio] = {};
      if (!almanaque[anio][mes]) almanaque[anio][mes] = {};
      if (!almanaque[anio][mes][dia]) {
        almanaque[anio][mes][dia] = {
          nombre: d.toLocaleString("es-ES", { weekday: "long" }),
          fotos: [],
        };
      }
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
      {/* FILTROS */}
      <div className="flex items-center gap-4 mb-10 sticky top-0 z-40 bg-[#fafafb]/80 backdrop-blur-md py-4 overflow-x-auto no-scrollbar">
        {categoriasFiltro.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltro(cat.id)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
              filtro === cat.id
                ? "bg-slate-900 text-white shadow-xl scale-105"
                : "bg-white text-slate-400 border-slate-100"
            }`}
          >
            <span className="text-sm">{cat.icon}</span> {cat.id}
          </button>
        ))}
      </div>

      {/* GALERÍA */}
      {Object.keys(datosCrono)
        .sort((a, b) => Number(b) - Number(a))
        .map((anio) => (
          <div key={anio} className="mt-12 text-left">
            <h2 className="text-5xl font-black text-slate-800/10 mb-8 select-none tracking-tighter">
              {anio}
            </h2>
            {Object.keys(datosCrono[anio]).map((mes) => (
              <div key={mes} className="mb-10 border-l-2 border-pink-50 pl-6">
                <h3 className="text-lg font-bold text-pink-400 mb-6 uppercase tracking-widest italic">
                  {mes}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Object.keys(datosCrono[anio][mes]).map((dia) =>
                    datosCrono[anio][mes][dia].fotos.map((m: Memoria) => (
                      <motion.div
                        key={m.id}
                        layoutId={`card-${m.id}`}
                        onClick={() => {
                          setSelected(m);
                          setCurrentImgIndex(0);
                        }}
                        className="group relative bg-white rounded-[40px] overflow-hidden shadow-xl cursor-pointer border border-white"
                        whileHover={{ y: -8 }}
                      >
                        {m.urls.length > 1 && (
                          <div className="absolute top-4 right-4 z-20 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                            1/{m.urls.length}
                          </div>
                        )}
                        <img
                          src={m.urls[0]}
                          className="aspect-[4/5] w-full object-cover"
                          alt="recuerdo"
                        />
                        <div className="p-5 flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            {dia} {mes.toLowerCase()}
                          </span>
                          <div className="flex -space-x-2">
                            {m.reacciones?.slice(0, 3).map((r, i) => (
                              <span
                                key={i}
                                className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs border border-slate-100 shadow-sm"
                              >
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* MODAL ESTILO INSTAGRAM */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cerrarModal}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl"
            />

            <motion.div
              layoutId={`card-${selected.id}`}
              className="relative bg-white w-full max-w-5xl md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full md:h-auto max-h-[100vh] md:max-h-[85vh] z-50"
            >
              {/* CARRUSEL */}
              <div className="relative w-full md:w-[60%] bg-black flex items-center justify-center h-[45vh] md:h-auto">
                <img
                  src={selected.urls[currentImgIndex]}
                  className="max-h-full w-full object-contain"
                  alt="img"
                />

                {selected.urls.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex((p) =>
                          p > 0 ? p - 1 : selected.urls.length - 1
                        );
                      }}
                      className="absolute left-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex((p) =>
                          p < selected.urls.length - 1 ? p + 1 : 0
                        );
                      }}
                      className="absolute right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-all"
                    >
                      <ChevronRight />
                    </button>
                    <div className="absolute bottom-6 flex gap-1.5">
                      {selected.urls.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i === currentImgIndex
                              ? "bg-white w-4"
                              : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* DETALLES */}
              <div className="w-full md:w-[40%] p-8 flex flex-col bg-white overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                  <img
                    src={
                      selected.autorFoto ||
                      `https://ui-avatars.com/api/?name=${selected.autor}`
                    }
                    className="w-10 h-10 rounded-full border-2 border-pink-100"
                  />
                  <div>
                    <p className="text-sm font-black uppercase text-slate-700">
                      {selected.autor}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <CalendarDays size={10} /> {selected.fecha.split("T")[0]}
                    </p>
                  </div>
                  <button
                    onClick={cerrarModal}
                    className="ml-auto p-2 bg-slate-50 rounded-full text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <p className="text-slate-600 text-lg font-serif italic mb-8 flex-1 leading-relaxed">
                  "{selected.descripcion}"
                </p>

                {/* REACCIONES */}
                <div className="border-t pt-6">
                  <div className="flex gap-5 mb-4">
                    <button
                      onClick={() => handleReaccionar(selected.id, "❤️")}
                      className="hover:scale-125 transition-transform"
                    >
                      <Heart size={26} className="text-pink-500" />
                    </button>
                    <button
                      onClick={() => handleReaccionar(selected.id, "😂")}
                      className="hover:scale-125 transition-transform"
                    >
                      <Laugh size={26} className="text-yellow-500" />
                    </button>
                    <button
                      onClick={() => handleReaccionar(selected.id, "🔥")}
                      className="hover:scale-125 transition-transform"
                    >
                      <Flame size={26} className="text-orange-500" />
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">
                      Reacciones
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selected.reacciones && selected.reacciones.length > 0 ? (
                        selected.reacciones.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 text-[10px] font-bold"
                          >
                            <span>{r.emoji}</span> {r.nombre}
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-300 italic">
                          Nadie ha reaccionado aún...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
