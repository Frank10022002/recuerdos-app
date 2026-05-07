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
  Heart,
  Sparkles,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("Todos");
  const [verReacciones, setVerReacciones] = useState(false);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);

  const selected = useMemo(
    () => memorias.find((m) => m.id === selectedId) || null,
    [memorias, selectedId]
  );

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

  const reaccionesConfig = [
    { emoji: "❤️", label: "Me encanta" },
    { emoji: "😂", label: "Me divierte" },
    { emoji: "🔥", label: "Me quema" },
    { emoji: "😮", label: "Me asombra" },
    { emoji: "🐱", label: "Me enfreshquese" },
    { emoji: "🙌", label: "Me alegra" },
  ];

  useEffect(() => {
    const handleMagic = () => {
      if (memorias.length > 0) {
        const randomIndex = Math.floor(Math.random() * memorias.length);
        const mId = memorias[randomIndex].id;
        window.history.pushState({ modalOpen: true }, "");
        setSelectedId(mId);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ec4899", "#f43f5e", "#ffffff"],
        });
      }
    };
    window.addEventListener("magicMemory", handleMagic);
    return () => window.removeEventListener("magicMemory", handleMagic);
  }, [memorias]);

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

  // Control del botón "Atrás" de Android para no cerrar la app
  useEffect(() => {
    const handlePopState = () => {
      if (selectedId !== null) {
        setSelectedId(null);
        setVerReacciones(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedId]);

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
      html: `<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%;">
          <label style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; align-self: start; margin-left: 10%;">Historia</label>
          <textarea id="swal-desc" class="swal2-textarea" style="margin:0; width: 80%; border-radius: 12px; font-size: 13px; resize: none;">${
            m.descripcion
          }</textarea>
          <label style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; align-self: start; margin-left: 10%;">Categoría</label>
          <select id="swal-cat" class="swal2-select" style="margin:0; width: 80%; border-radius: 12px;">${opcionesCats}</select>
          <label style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; align-self: start; margin-left: 10%;">Fecha</label>
          <input id="swal-date" type="date" class="swal2-input" style="margin:0; width: 80%; border-radius: 12px;" value="${
            m.fecha.split("T")[0]
          }">
        </div>`,
      showCancelButton: true,
      confirmButtonColor: "#1e293b",
      preConfirm: () => ({
        descripcion: (
          document.getElementById("swal-desc") as HTMLTextAreaElement
        ).value,
        categoria: (document.getElementById("swal-cat") as HTMLSelectElement)
          .value,
        fecha:
          (document.getElementById("swal-date") as HTMLInputElement).value +
          "T12:00:00",
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

  // Cierra el modal de forma segura (con o sin historial)
  const closeModal = () => {
    if (window.history.state?.modalOpen) {
      window.history.back();
    } else {
      setSelectedId(null);
      setVerReacciones(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="animate-spin text-pink-500" size={48} />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">
          Organizando baúl...
        </p>
      </div>
    );

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 px-4 overflow-x-hidden min-h-screen">
      <div className="flex items-center gap-3 mb-10 sticky top-0 z-40 bg-[#fafafb]/95 backdrop-blur-md py-4 overflow-x-auto no-scrollbar border-b border-slate-100 px-2">
        <Filter size={16} className="text-slate-400 shrink-0" />
        {categoriasMaster.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltro(cat.id)}
            className={`px-5 py-2 rounded-full text-[10px] font-black transition-all shrink-0 flex items-center gap-2 border ${
              filtro === cat.id
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-400 border-slate-100"
            }`}
          >
            <span>{cat.icon}</span> {cat.id}
          </button>
        ))}
      </div>

      {Object.keys(datosCrono)
        .sort((a, b) => Number(b) - Number(a))
        .map((anio) => (
          <div key={anio} className="relative mb-32 pt-10">
            {/* AÑO PERFECTAMENTE CENTRADO */}
            <div className="absolute top-[-30px] md:top-[-50px] inset-x-0 w-full flex justify-center items-center pointer-events-none select-none z-0 opacity-[0.08] overflow-hidden">
              <h2 className="text-[140px] md:text-[180px] font-black leading-none tracking-tighter text-slate-900 text-center">
                {anio}
              </h2>
            </div>

            <div className="relative z-10">
              {Object.keys(datosCrono[anio]).map((mes) => (
                <div key={mes} className="mb-24">
                  <div className="flex items-center gap-3 mb-12">
                    <div className="bg-pink-500 text-white px-6 py-2 rounded-full shadow-lg shadow-pink-100 flex items-center gap-2">
                      <Sparkles size={14} className="text-pink-200" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {mes}
                      </span>
                    </div>
                    <div className="h-[2px] flex-1 bg-gradient-to-r from-pink-200 to-transparent"></div>
                  </div>
                  {Object.keys(datosCrono[anio][mes])
                    .sort((a, b) => Number(b) - Number(a))
                    .map((dia) => (
                      <div key={dia} className="mb-16">
                        <div className="flex items-baseline gap-3 mb-8 border-l-4 border-pink-500 pl-4">
                          <span className="text-2xl font-bold text-slate-400 italic lowercase">
                            {dia}{" "}
                            <span className="text-2xl font-bold text-slate-400 italic lowercase">
                              de {mes}
                            </span>
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {datosCrono[anio][mes][dia].fotos.map(
                            (m: Memoria) => {
                              const principal = m.archivos
                                ? m.archivos[0]
                                : { url: m.urls?.[0] || m.url, tipo: m.tipo };
                              return (
                                <motion.div
                                  key={m.id}
                                  whileHover={{ y: -8 }}
                                  onClick={() => {
                                    window.history.pushState(
                                      { modalOpen: true },
                                      ""
                                    );
                                    setSelectedId(m.id);
                                  }}
                                  className="group relative bg-white rounded-[40px] overflow-hidden shadow-xl border-4 border-white cursor-pointer"
                                >
                                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                                    <div className="absolute top-4 right-4 z-20 text-white/40 group-hover:text-pink-500 transition-colors">
                                      <Heart size={18} fill="currentColor" />
                                    </div>
                                    <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm border border-white/50">
                                      <span className="text-[10px]">
                                        {categoriasMaster.find(
                                          (c) => c.id === m.categoria
                                        )?.icon || "📸"}
                                      </span>
                                      <span className="text-[8px] font-black text-slate-700 uppercase tracking-tight">
                                        {m.categoria}
                                      </span>
                                    </div>
                                    {principal.tipo === "video" ? (
                                      <div className="w-full h-full relative bg-black">
                                        <video
                                          src={`${principal.url}#t=0.001`}
                                          className="w-full h-full object-cover"
                                          muted
                                          playsInline
                                          preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                          <div className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
                                            <Play
                                              size={20}
                                              className="text-white ml-0.5"
                                              fill="white"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <img
                                        src={principal.url}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt="img"
                                      />
                                    )}
                                  </div>
                                  <div className="p-6">
                                    <p className="text-slate-500 text-[11px] leading-relaxed italic text-center font-medium line-clamp-2">
                                      "{m.descripcion}"
                                    </p>
                                  </div>
                                </motion.div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        ))}

      <AnimatePresence>
        {selected && (
          // MODAL: Ajustado p-0 en móviles para aprovechar toda la pantalla
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              // MODAL CONTENEDOR: Ocupa todo el alto y ancho en móvil
              className="relative bg-white w-full h-full max-w-7xl md:rounded-[50px] overflow-hidden flex flex-col md:flex-row md:h-[85vh] z-50 shadow-2xl"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(selected);
                }}
                className="absolute top-6 left-6 z-[110] p-3 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-xl transition-all shadow-lg"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeModal();
                }}
                className="absolute top-6 right-6 z-[110] p-3 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-all shadow-lg"
              >
                <X size={20} />
              </button>

              {/* FOTO MÁS GRANDE EN MÓVIL: Cambiado a h-[55vh] para que la foto sea más alta */}
              <div className="w-full md:w-[65%] bg-black relative h-[55vh] md:h-full overflow-hidden shrink-0">
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
                  ).map((arc: any, i: number) => (
                    <SwiperSlide
                      key={i}
                      className="flex items-center justify-center bg-black overflow-hidden"
                    >
                      {arc.tipo === "video" ? (
                        <video
                          src={`${arc.url}#t=0.001`}
                          controls
                          className="w-full h-full object-cover"
                          playsInline
                        />
                      ) : (
                        <img
                          src={arc.url}
                          className="w-full h-full object-cover"
                          alt="media"
                        />
                      )}
                    </SwiperSlide>
                  ))}
                  <button className="next-btn absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 rounded-full text-white hover:bg-white/30 backdrop-blur-md transition-all">
                    <ChevronRight size={24} />
                  </button>
                  <button className="prev-btn absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/10 rounded-full text-white hover:bg-white/30 backdrop-blur-md transition-all">
                    <ChevronLeft size={24} />
                  </button>
                </Swiper>
              </div>

              {/* INFO CONTENEDOR */}
              <div className="w-full md:w-[35%] p-8 flex flex-col bg-white overflow-y-auto items-center flex-1">
                <div className="w-full flex flex-col gap-6 flex-1 items-center pb-16">
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-pink-50 rounded-full w-fit mx-auto">
                      <Calendar className="text-pink-500" size={20} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                      {parsearFecha(selected.fecha).toLocaleDateString(
                        "es-ES",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </h2>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[15px] font-black uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 w-max mx-auto">
                      <Clock size={12} className="text-pink-400" />
                      {parsearFecha(selected.fecha).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-[30px] border border-slate-100 w-full">
                    <img
                      src={selected.autorFoto}
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      alt="autor"
                    />
                    <div className="text-left">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Subido por
                      </p>
                      <p className="font-bold text-slate-800 text-sm tracking-tight leading-tight">
                        {selected.autor}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-600 text-base italic font-bold leading-relaxed text-center px-2 border-none bg-transparent">
                    "{selected.descripcion}"
                  </p>

                  <div className="mt-auto pt-8 w-full flex flex-col gap-6">
                    <div className="relative">
                      <AnimatePresence>
                        {hoveredEmoji && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-wider whitespace-nowrap z-50 shadow-xl"
                          >
                            {hoveredEmoji}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-3 p-3 bg-pink-50/50 rounded-full border border-pink-100 justify-center">
                        {reaccionesConfig.map((item) => (
                          <button
                            key={item.emoji}
                            onMouseEnter={() => setHoveredEmoji(item.label)}
                            onMouseLeave={() => setHoveredEmoji(null)}
                            onClick={() =>
                              handleReaccionar(selected.id, item.emoji)
                            }
                            className={`text-2xl hover:scale-125 transition-transform ${
                              selected.reacciones?.[auth.currentUser?.uid || ""]
                                ?.emoji === item.emoji
                                ? "bg-white shadow-lg rounded-full scale-110 p-0.5"
                                : ""
                            }`}
                          >
                            {item.emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full flex flex-col items-center">
                      <button
                        onClick={() => setVerReacciones(!verReacciones)}
                        className="w-full text-[8px] font-black uppercase text-slate-400 hover:text-pink-500 transition-colors"
                      >
                        {Object.keys(selected.reacciones || {}).length}{" "}
                        Reacciones
                      </button>

                      <AnimatePresence initial={false}>
                        {verReacciones &&
                          Object.keys(selected.reacciones || {}).length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="w-full overflow-hidden"
                            >
                              <div className="flex flex-wrap justify-center gap-3 pt-4 pb-2 border-t border-slate-100 mt-4">
                                {Object.entries(selected.reacciones || {}).map(
                                  ([uid, r]) => (
                                    <motion.div
                                      initial={{ scale: 0.9, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      key={uid}
                                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm relative text-[11px] font-black uppercase tracking-tight"
                                    >
                                      <img
                                        src={r.foto}
                                        className="w-6 h-6 rounded-full border border-pink-100"
                                        alt="r"
                                      />
                                      <span className="text-slate-700">
                                        {r.nombre}
                                      </span>
                                      <span className="absolute -top-2.5 -right-1.5 text-[14px] drop-shadow-sm">
                                        {r.emoji}
                                      </span>
                                    </motion.div>
                                  )
                                )}
                              </div>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={async () => {
                        if (
                          (
                            await Swal.fire({
                              title: "¿Eliminar?",
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#ef4444",
                              customClass: { popup: "rounded-[32px]" },
                            })
                          ).isConfirmed
                        ) {
                          await deleteDoc(doc(db, "memorias", selected.id));
                          closeModal();
                        }
                      }}
                      className="w-full flex flex-col items-center gap-1.5 p-6 bg-red-50 text-red-500 rounded-[35px] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        ELIMINAR RECUERDO
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
