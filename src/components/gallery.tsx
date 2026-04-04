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
import { Clock, X, CalendarDays, Trash2, Filter, Pencil } from "lucide-react";

interface Memoria {
  id: string;
  url: string;
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
    { id: "Diversión", icon: "😂" },
    { id: "Aniversario", icon: "✨" },
    { id: "Comida", icon: "🍕" },
    { id: "Recuerdo", icon: "📸" },
    { id: "Momentos Random", icon: "🎲" },
  ];

  useEffect(() => {
    const q = query(collection(db, "memorias"), orderBy("fecha", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Memoria[];
      setMemorias(datos);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const abrirAzar = () => {
      if (memorias.length > 0) {
        const random = memorias[Math.floor(Math.random() * memorias.length)];
        setSelected(random);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ec4899", "#f43f5e", "#fb7185"],
        });
      }
    };
    window.addEventListener("magicMemory", abrirAzar);
    return () => window.removeEventListener("magicMemory", abrirAzar);
  }, [memorias]);

  // FUNCIÓN AUXILIAR PARA VALIDAR FECHAS (La clave de la solución)
  const parsearFechaSegura = (fechaStr: string) => {
    if (!fechaStr) return new Date();
    // Reemplazamos guiones por barras y quitamos la T para máxima compatibilidad
    const limpio = fechaStr.replace(/-/g, "/").replace("T", " ");
    const d = new Date(limpio);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const handleDelete = async (id: string) => {
    const res = await Swal.fire({
      title: "¿Borrar recuerdo?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      customClass: { popup: "rounded-[32px]" },
    });
    if (res.isConfirmed) {
      await deleteDoc(doc(db, "memorias", id));
      setSelected(null);
    }
  };

  const handleFullEdit = async (m: Memoria) => {
    const { value: formValues } = await Swal.fire({
      title: "Editar Recuerdo",
      html: `
        <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
          <label style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Historia</label>
          <textarea id="swal-desc" class="swal2-textarea" style="margin: 0; width: 100%; border-radius: 15px; font-style: italic;">${
            m.descripcion
          }</textarea>
          
          <label style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Categoría</label>
          <select id="swal-cat" class="swal2-input" style="margin: 0; width: 100%; border-radius: 15px;">
            ${categoriasFiltro
              .filter((c) => c.id !== "Todos")
              .map(
                (c) =>
                  `<option value="${c.id}" ${
                    m.categoria === c.id ? "selected" : ""
                  }>${c.icon} ${c.id}</option>`
              )
              .join("")}
          </select>

          <label style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8;">Fecha</label>
          <input id="swal-date" type="date" class="swal2-input" style="margin: 0; width: 100%; border-radius: 15px;" value="${
            m.fecha.split("T")[0]
          }">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      confirmButtonColor: "#1e293b",
      customClass: { popup: "rounded-[32px]" },
      preConfirm: () => {
        return {
          descripcion: (
            document.getElementById("swal-desc") as HTMLTextAreaElement
          ).value,
          categoria: (document.getElementById("swal-cat") as HTMLSelectElement)
            .value,
          fecha:
            (document.getElementById("swal-date") as HTMLInputElement).value +
            "T" +
            (m.fecha.split("T")[1] || "12:00:00"),
        };
      },
    });

    if (formValues) {
      await updateDoc(doc(db, "memorias", m.id), formValues);
      Swal.fire({
        icon: "success",
        title: "¡Actualizado!",
        showConfirmButton: false,
        timer: 1000,
      });
    }
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
      {/* BARRA DE FILTROS */}
      <div className="flex items-center gap-4 mb-10 sticky top-0 z-40 bg-[#fafafb]/80 backdrop-blur-md py-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 mr-2 text-slate-400 shrink-0">
          <Filter size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            Filtrar:
          </span>
        </div>
        <div className="flex items-center gap-3">
          {categoriasFiltro.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltro(cat.id)}
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 border ${
                filtro === cat.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105"
                  : "bg-white text-slate-400 border-slate-100 shadow-sm hover:border-slate-200"
              }`}
            >
              <span className="text-sm">{cat.icon}</span> {cat.id}
            </button>
          ))}
        </div>
      </div>

      {/* GALERÍA POR AÑOS */}
      {Object.keys(datosCrono)
        .sort((a, b) => Number(b) - Number(a))
        .map((anio) => (
          <div key={anio} className="mt-12 text-left">
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
                        {datosCrono[anio][mes][dia].fotos.map((m: Memoria) => (
                          <motion.div
                            key={m.id}
                            className="group relative bg-white rounded-[40px] overflow-hidden shadow-xl shadow-slate-100 border border-white"
                            whileHover={{ y: -8 }}
                          >
                            {/* AUTOR */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-sm border border-white/40">
                              <img
                                src={
                                  m.autorFoto ||
                                  `https://ui-avatars.com/api/?name=${m.autor}&background=fce7f3&color=ec4899`
                                }
                                className="w-5 h-5 rounded-full object-cover border border-white"
                                alt="perfil"
                              />
                              <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">
                                {m.autor}
                              </span>
                            </div>

                            {/* EDITAR */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFullEdit(m);
                              }}
                              className="absolute top-4 right-4 z-30 p-2.5 bg-white/90 rounded-2xl text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-slate-900 shadow-sm border border-white/50 backdrop-blur-md"
                            >
                              <Pencil size={14} />
                            </button>

                            <div
                              onClick={() => setSelected(m)}
                              className="cursor-pointer"
                            >
                              <div className="absolute bottom-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase text-pink-500 border border-white/50 shadow-sm">
                                #{m.categoria || "Recuerdo"}
                              </div>
                              <div className="aspect-[4/5] bg-slate-50 flex items-center justify-center overflow-hidden">
                                {m.tipo === "video" ? (
                                  <video
                                    src={m.url}
                                    className="w-full h-full object-cover"
                                    poster={m.url.replace(/\.[^/.]+$/, ".jpg")}
                                    preload="metadata"
                                    playsInline
                                    muted
                                    loop
                                  />
                                ) : (
                                  <img
                                    src={m.url}
                                    className="w-full h-full object-cover"
                                    alt="recuerdo"
                                  />
                                )}
                              </div>
                              <div className="p-6 text-slate-500 italic text-sm truncate font-medium">
                                "{m.descripcion}"
                              </div>
                            </div>
                          </motion.div>
                        ))}
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
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 text-left"
            key="modal"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-6xl md:rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full md:h-auto max-h-[100vh] md:max-h-[90vh] z-50"
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-6 right-6 z-[60] p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="w-full md:w-[65%] bg-black flex items-center justify-center h-[45vh] md:h-auto overflow-hidden">
                {selected.tipo === "video" ? (
                  <video
                    src={selected.url}
                    controls
                    className="max-h-full w-full"
                    autoPlay
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <img
                    src={selected.url}
                    className="max-h-full w-full object-contain"
                    alt="preview"
                  />
                )}
              </div>

              <div className="w-full md:w-[35%] p-8 md:p-12 flex flex-col gap-6 bg-white overflow-y-auto">
                <div>
                  <span className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                    #{selected.categoria || "Recuerdo"}
                  </span>
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1 mt-4">
                    <CalendarDays size={12} /> Detalle
                  </h4>
                  <p className="text-2xl font-serif italic text-slate-800 leading-tight">
                    {parsearFechaSegura(selected.fecha).toLocaleDateString(
                      "es-ES",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </p>
                  <p className="text-slate-400 text-xs flex items-center gap-1 font-bold bg-slate-50 w-fit px-3 py-1.5 rounded-full border border-slate-100 mt-2">
                    <Clock size={12} className="text-pink-300" />
                    {parsearFechaSegura(selected.fecha).toLocaleTimeString(
                      "es-ES",
                      { hour: "2-digit", minute: "2-digit", hour12: true }
                    )}
                  </p>
                </div>
                <div className="h-px bg-slate-100 w-full" />
                <div className="flex flex-col items-center gap-2">
                  <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    Subido por:
                  </h4>
                  <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <img
                      src={
                        selected.autorFoto ||
                        `https://ui-avatars.com/api/?name=${selected.autor}&background=fce7f3&color=ec4899`
                      }
                      className="w-6 h-6 rounded-full border shadow-sm"
                      alt="perfil"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter">
                      {selected.autor}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">
                    Nuestra Historia
                  </h4>
                  <p className="text-slate-600 text-lg leading-relaxed font-medium italic whitespace-pre-wrap">
                    "{selected.descripcion}"
                  </p>
                </div>
                <div className="pt-8 border-t border-slate-50 flex flex-col items-center gap-6 mt-auto">
                  <button
                    onClick={() => handleDelete(selected.id)}
                    className="flex items-center gap-2 px-6 py-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group w-fit"
                  >
                    <Trash2
                      size={18}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest">
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
