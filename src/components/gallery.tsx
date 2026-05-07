import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import confetti from "canvas-confetti";
import {
  Clock,
  X,
  Calendar,
  Trash2,
  Filter,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
} from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface Archivo {
  url: string;
  tipo: "foto" | "video";
}

interface Reaccion {
  nombre: string;
  foto: string;
  emoji: string;
}

interface Memoria {
  id: string;
  archivos?: Archivo[];
  urls?: string[];
  url?: string;
  tipo: "foto" | "video";
  descripcion: string;
  fecha: string;
  autor?: string;
  autorFoto?: string;
  categoria?: string;
  reacciones?: Record<string, Reaccion>;
}

export const Gallery: React.FC = () => {
  const [memorias, setMemorias] = useState<Memoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Memoria | null>(null);
  const [filtro, setFiltro] = useState("Todos");

  const categoriasMaster = [
    { id: "Todos", icon: "🌈" },
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

  const handleReaccionar = async (mId: string, emoji: string) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const memoriaRef = doc(db, "memorias", mId);
    const memoriaActual = memorias.find((m) => m.id === mId);
    const nuevasReacciones = { ...(memoriaActual?.reacciones || {}) };

    if (nuevasReacciones[user.uid]?.emoji === emoji) {
      delete nuevasReacciones[user.uid];
    } else {
      nuevasReacciones[user.uid] = {
        nombre: user.displayName || "Usuario",
        foto: user.photoURL || "",
        emoji,
      };
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }
    await updateDoc(memoriaRef, { reacciones: nuevasReacciones });
  };

  const handleEdit = async (m: Memoria) => {
    const opcionesCats = categoriasMaster
      .filter((c) => c.id !== "Todos")
      .map(
        (c) =>
          `<option value="${c.id}" ${m.categoria === c.id ? "selected" : ""}>${
            c.icon
          } ${c.id}</option>`
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "Editar Momento",
      html: `
        <textarea id="swal-desc" class="swal2-textarea" style="border-radius: 15px;">${
          m.descripcion
        }</textarea>
        <select id="swal-cat" class="swal2-select" style="border-radius: 15px;">${opcionesCats}</select>
        <input id="swal-date" type="date" class="swal2-input" style="border-radius: 15px;" value="${
          m.fecha.split("T")[0]
        }">
      `,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      confirmButtonColor: "#1e293b",
      preConfirm: () => ({
        descripcion: (
          document.getElementById("swal-desc") as HTMLTextAreaElement
        ).value,
        categoria: (document.getElementById("swal-cat") as HTMLSelectElement)
          .value,
        fecha:
          (document.getElementById("swal-date") as HTMLInputElement).value +
          "T" +
          (m.fecha.split("T")[1] || "12:00:00"),
      }),
    });

    if (formValues) await updateDoc(doc(db, "memorias", m.id), formValues);
  };

  const parsearFecha = (f: string) => {
    const d = new Date(f.replace(/-/g, "/").replace("T", " "));
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const datosCrono = useMemo(() => {
    const almanaque: any = {};
    const filtradas =
      filtro === "Todos"
        ? memorias
        : memorias.filter((m) => m.categoria === filtro);

    filtradas.forEach((m) => {
      const d = parsearFecha(m.fecha);
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
  }, [memorias, filtro]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-pink-500" size={48} />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">
          Abriendo el baúl...
        </p>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 px-4">
      {/* Filtros */}
      <div className="flex items-center gap-3 mb-12 sticky top-0 z-40 bg-[#fafafb]/90 backdrop-blur-xl py-6 overflow-x-auto no-scrollbar border-b border-slate-100/50">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 shrink-0">
          <Filter size={18} className="text-pink-500" />
        </div>
        {categoriasMaster.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltro(cat.id)}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all shrink-0 flex items-center gap-2 border shadow-sm ${
              filtro === cat.id
                ? "bg-slate-900 text-white border-slate-900 scale-105 shadow-slate-200"
                : "bg-white text-slate-500 border-slate-100 hover:border-pink-200"
            }`}
          >
            <span>{cat.icon}</span> {cat.id}
          </button>
        ))}
      </div>

      {/* Grid Cronológico */}
      {Object.keys(datosCrono)
        .sort((a, b) => Number(b) - Number(a))
        .map((anio) => (
          <div key={anio} className="relative mb-24">
            <h2 className="text-8xl font-black text-slate-900/5 absolute -top-12 -left-4 pointer-events-none tracking-tighter">
              {anio}
            </h2>
            {Object.keys(datosCrono[anio]).map((mes) => (
              <div key={mes} className="mb-16 relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <h3 className="text-xs font-black text-pink-500 uppercase tracking-[0.4em] bg-pink-50 px-5 py-2 rounded-full border border-pink-100">
                    {mes}
                  </h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-pink-100 to-transparent"></div>
                </div>

                {Object.keys(datosCrono[anio][mes])
                  .sort((a, b) => Number(b) - Number(a))
                  .map((dia) => (
                    <div key={dia} className="mb-14">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl font-black text-slate-800">
                          {dia}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {datosCrono[anio][mes][dia].nombre}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {datosCrono[anio][mes][dia].fotos.map((m: Memoria) => {
                          const principal = m.archivos
                            ? m.archivos[0]
                            : { url: m.urls?.[0] || m.url, tipo: m.tipo };
                          return (
                            <motion.div
                              key={m.id}
                              whileHover={{ y: -12, scale: 1.02 }}
                              className="group relative bg-white rounded-[50px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white cursor-pointer"
                              onClick={() => setSelected(m)}
                            >
                              <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative">
                                {principal.tipo === "video" ? (
                                  <div className="w-full h-full relative">
                                    <video
                                      src={principal.url}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                        <Play
                                          size={32}
                                          className="text-white ml-1"
                                          fill="white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={principal.url}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt="rec"
                                  />
                                )}
                              </div>
                              <div className="p-8">
                                <p className="text-slate-600 text-sm leading-relaxed italic line-clamp-2 font-medium text-center">
                                  "{m.descripcion}"
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-6xl md:rounded-[60px] overflow-hidden flex flex-col md:flex-row h-full md:h-[85vh] z-50 shadow-2xl"
            >
              {/* EDITAR SOBRE LA FOTO */}
              <button
                onClick={() => handleEdit(selected)}
                className="absolute top-8 left-8 z-[110] p-4 bg-black/20 text-white rounded-full hover:bg-black/40 backdrop-blur-md transition-all shadow-xl"
              >
                <Pencil size={24} />
              </button>

              {/* CERRAR VISIBLE */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-8 right-8 z-[110] p-4 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-all shadow-lg"
              >
                <X size={24} />
              </button>

              <div className="w-full md:w-[65%] bg-black relative h-[50vh] md:h-auto overflow-hidden">
                <Swiper
                  modules={[Pagination, Navigation]}
                  pagination={{ clickable: true }}
                  navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
                  className="w-full h-full"
                >
                  {(
                    selected.archivos ||
                    (selected.urls || [selected.url]).map((u) => ({
                      url: u,
                      tipo: selected.tipo,
                    }))
                  ).map((archivo: any, i: number) => (
                    <SwiperSlide
                      key={i}
                      className="flex items-center justify-center"
                    >
                      {archivo.tipo === "video" ? (
                        <video
                          src={archivo.url}
                          controls
                          className="w-full h-full object-cover"
                          playsInline
                        />
                      ) : (
                        <img
                          src={archivo.url}
                          className="w-full h-full object-cover"
                          alt="media"
                        />
                      )}
                    </SwiperSlide>
                  ))}
                  <button className="next-btn absolute right-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-all">
                    <ChevronRight size={24} />
                  </button>
                  <button className="prev-btn absolute left-6 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-all">
                    <ChevronLeft size={24} />
                  </button>
                </Swiper>
              </div>

              <div className="w-full md:w-[35%] p-10 flex flex-col bg-white overflow-y-auto items-center">
                <div className="flex flex-col gap-6 flex-1 w-full items-center">
                  <div className="space-y-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-4 bg-pink-50 rounded-full">
                        <Calendar className="text-pink-500" size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tighter">
                        {parsearFecha(selected.fecha).toLocaleDateString(
                          "es-ES",
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest bg-slate-50 w-fit px-4 py-2 rounded-full border border-slate-100 mx-auto">
                      <Clock size={14} className="text-pink-400" />
                      {parsearFecha(selected.fecha).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[30px] border border-slate-100 w-full">
                    <img
                      src={selected.autorFoto}
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                      alt="autor"
                    />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                        Subido por
                      </p>
                      <p className="font-black text-slate-800 text-sm text-left">
                        {selected.autor}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full" />

                  <p className="text-slate-600 text-xl italic font-medium leading-relaxed text-center px-4">
                    "{selected.descripcion}"
                  </p>

                  <div className="mt-auto pt-8 w-full">
                    <div className="flex gap-3 p-4 bg-pink-50/50 rounded-full border border-pink-100 justify-center mb-4">
                      {["❤️", "😂", "🔥", "😮", "🙌"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaccionar(selected.id, emoji)}
                          className={`text-2xl hover:scale-125 transition-transform p-1 ${
                            selected.reacciones?.[auth.currentUser?.uid || ""]
                              ?.emoji === emoji
                              ? "bg-white shadow-md rounded-full scale-110"
                              : ""
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* QUIÉNES REACCIONARON */}
                    {selected.reacciones &&
                      Object.keys(selected.reacciones).length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-2">
                          {Object.values(selected.reacciones).map((re, idx) => (
                            <div key={idx} className="group relative">
                              <div className="relative">
                                <img
                                  src={re.foto}
                                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                  alt={re.nombre}
                                />
                                <span className="absolute -bottom-1 -right-1 text-[10px] bg-white rounded-full shadow-sm w-4 h-4 flex items-center justify-center">
                                  {re.emoji}
                                </span>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {re.nombre}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    <button
                      onClick={async () => {
                        const res = await Swal.fire({
                          title: "¿Eliminar?",
                          icon: "warning",
                          showCancelButton: true,
                          confirmButtonColor: "#ef4444",
                          confirmButtonText: "Sí",
                        });
                        if (res.isConfirmed) {
                          await deleteDoc(doc(db, "memorias", selected.id));
                          setSelected(null);
                        }
                      }}
                      className="w-full flex flex-col items-center gap-2 p-6 bg-red-50 text-red-500 rounded-[40px] hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                    >
                      <Trash2
                        size={24}
                        className="group-hover:scale-110 transition-transform"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Eliminar Recuerdo
                      </span>
                    </button>
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
