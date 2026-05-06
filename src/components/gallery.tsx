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
  Play,
  Loader2,
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
  url?: string;
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

  // LISTA DE CATEGORÍAS ACTUALIZADA (CON PERRO Y GATO)
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
      title: "Editar Recuerdo",
      html: `
        <div style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
          <label style="font-size: 10px; font-weight: bold; color: #94a3b8;">HISTORIA</label>
          <textarea id="swal-desc" class="swal2-textarea" style="margin:0; border-radius: 15px;">${m.descripcion}</textarea>
          <label style="font-size: 10px; font-weight: bold; color: #94a3b8;">CATEGORÍA</label>
          <select id="swal-cat" class="swal2-select" style="margin:0; width: 100%; border-radius: 15px;">${opcionesCats}</select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#1e293b",
      preConfirm: () => ({
        descripcion: (
          document.getElementById("swal-desc") as HTMLTextAreaElement
        ).value,
        categoria: (document.getElementById("swal-cat") as HTMLSelectElement)
          .value,
      }),
    });
    if (formValues) {
      await updateDoc(doc(db, "memorias", m.id), formValues);
      Swal.fire({
        icon: "success",
        title: "Actualizado",
        timer: 1000,
        showConfirmButton: false,
      });
    }
  };

  const parsearFecha = (f: string) => {
    const d = new Date(f.replace(/-/g, "/").replace("T", " "));
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const esVideoURL = (url: string) =>
    url?.toLowerCase().match(/\.(mp4|webm|mov)$/);

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
      <div className="flex flex-col items-center justify-center py-40 text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="italic font-medium">Abriendo el baúl...</p>
      </div>
    );

  return (
    <div className="w-full perro">
      {/* BARRA DE FILTROS */}
      <div className="flex items-center gap-4 mb-10 sticky top-0 z-40 bg-[#fafafb]/80 backdrop-blur-md py-4 overflow-x-auto no-scrollbar px-4">
        <Filter size={16} className="text-slate-400 shrink-0" />
        {categoriasMaster.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFiltro(cat.id)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black border transition-all shrink-0 flex items-center gap-2 ${
              filtro === cat.id
                ? "bg-slate-900 text-white shadow-xl"
                : "bg-white text-slate-400 border-slate-100"
            }`}
          >
            <span>{cat.icon}</span> {cat.id}
          </button>
        ))}
      </div>

      {/* GALERÍA */}
      {Object.keys(datosCrono)
        .sort((a, b) => Number(b) - Number(a))
        .map((anio) => (
          <div key={anio} className="mt-12 text-left px-4 gato">
            <h2 className="text-5xl md:text-7xl font-black text-slate-800/10 mb-8 select-none tracking-tighter">
              {anio}
            </h2>
            {Object.keys(datosCrono[anio]).map((mes) => (
              <div
                key={mes}
                className="mb-10 border-l-2 border-pink-50 pl-6 md:pl-8"
              >
                <h3 className="text-lg font-bold text-pink-400 mb-6 uppercase tracking-widest italic">
                  {mes}
                </h3>
                {Object.keys(datosCrono[anio][mes])
                  .sort((a, b) => Number(b) - Number(a))
                  .map((dia) => (
                    <div key={dia} className="mb-12">
                      <p className="text-slate-400 text-[10px] mb-4 uppercase font-bold tracking-widest">
                        {datosCrono[anio][mes][dia].nombre}, {dia}{" "}
                        {mes.toLowerCase()}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {datosCrono[anio][mes][dia].fotos.map((m: Memoria) => {
                          const principalURL = m.urls ? m.urls[0] : m.url;
                          const esVideo =
                            esVideoURL(principalURL || "") ||
                            m.tipo === "video";
                          const catIcon =
                            categoriasMaster.find((c) => c.id === m.categoria)
                              ?.icon || "📸";

                          return (
                            <motion.div
                              key={m.id}
                              whileHover={{ y: -8 }}
                              className="group relative bg-white rounded-[40px] overflow-hidden shadow-xl shadow-slate-100 border border-white cursor-pointer"
                              onClick={() => setSelected(m)}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFullEdit(m);
                                }}
                                className="absolute top-4 right-4 z-30 p-2.5 bg-white/90 rounded-2xl text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-900 transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                              <div className="aspect-[4/5] bg-slate-50 overflow-hidden relative">
                                {esVideo ? (
                                  <div className="w-full h-full relative">
                                    <video
                                      src={principalURL}
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                      <Play
                                        size={40}
                                        className="text-white drop-shadow-lg"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={principalURL}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                    alt="recuerdo"
                                  />
                                )}
                                <span className="absolute bottom-4 right-4 bg-pink-100 text-pink-600 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white shadow-sm flex items-center gap-1">
                                  {catIcon} {m.categoria}
                                </span>
                              </div>
                              <div className="p-6 text-slate-500 italic text-sm truncate font-medium">
                                "{m.descripcion}"
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

      {/* MODAL DETALLE */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-6xl md:rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full md:h-auto max-h-[100vh] md:max-h-[90vh] z-50"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-6 right-6 z-[110] p-3 bg-white/20 text-white rounded-full hover:bg-white/40 backdrop-blur-md transition-all"
              >
                <X size={24} />
              </button>

              <div className="w-full md:w-[65%] bg-black relative h-[50vh] md:h-auto border-r border-slate-50 flex items-center justify-center overflow-hidden">
                <Swiper
                  modules={[Pagination, Navigation]}
                  pagination={{ clickable: true }}
                  navigation={{ nextEl: ".next-btn", prevEl: ".prev-btn" }}
                  className="w-full h-full"
                >
                  {(selected.urls || [selected.url]).map((u, i) => (
                    <SwiperSlide
                      key={i}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {esVideoURL(u || "") || selected.tipo === "video" ? (
                        <video
                          src={u}
                          controls
                          className="w-full h-full object-contain"
                          playsInline
                        />
                      ) : (
                        <img
                          src={u}
                          className="w-full h-full object-contain"
                          alt="img"
                        />
                      )}
                    </SwiperSlide>
                  ))}
                  {(selected.urls?.length ?? 0) > 1 && (
                    <>
                      <button className="prev-btn absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                        <ChevronLeft size={24} />
                      </button>
                      <button className="next-btn absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </Swiper>
              </div>

              <div className="w-full md:w-[35%] p-8 md:p-12 flex flex-col gap-6 bg-white overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selected.autorFoto}
                      className="w-8 h-8 rounded-full border border-white shadow-sm"
                      alt="autor"
                    />
                    <span className="text-xs font-black text-slate-700 uppercase">
                      {selected.autor}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-[9px] font-black uppercase w-fit flex items-center gap-1">
                    {
                      categoriasMaster.find((c) => c.id === selected.categoria)
                        ?.icon
                    }{" "}
                    #{selected.categoria}
                  </span>
                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-pink-300" />
                    <p className="text-2xl font-serif italic text-slate-800">
                      {parsearFecha(selected.fecha).toLocaleDateString(
                        "es-ES",
                        { day: "numeric", month: "long", year: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100">
                    <Clock size={12} className="text-pink-300" />
                    {parsearFecha(selected.fecha).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <p className="text-slate-600 text-lg leading-relaxed font-medium italic whitespace-pre-wrap flex-1">
                  "{selected.descripcion}"
                </p>

                <div className="mt-auto pt-8 flex flex-col items-center">
                  <button
                    onClick={async () => {
                      if (
                        (
                          await Swal.fire({
                            title: "¿Eliminar?",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#ef4444",
                          })
                        ).isConfirmed
                      ) {
                        await deleteDoc(doc(db, "memorias", selected.id));
                        setSelected(null);
                      }
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="p-4 bg-red-50 text-red-400 rounded-full group-hover:bg-red-100 transition-all">
                      <Trash2 size={28} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                      Eliminar Recuerdo
                    </span>
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
