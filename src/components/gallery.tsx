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

  const categorias = ["Todos", "Cita", "Viaje", "Comida", "Gatos", "Recuerdo"];

  useEffect(() => {
    const q = query(collection(db, "memorias"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snapshot) => {
      setMemorias(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          urls: d.data().urls || [d.data().url],
        })) as Memoria[]
      );
      setLoading(false);
    });
  }, []);

  const handleReaccionar = async (mId: string, emoji: string) => {
    if (!auth.currentUser) return;
    const user = auth.currentUser;
    const m = memorias.find((mem) => mem.id === mId);
    if (!m) return;
    const existe = m.reacciones?.find((r) => r.uid === user.uid);
    const ref = doc(db, "memorias", mId);
    if (existe) {
      await updateDoc(ref, { reacciones: arrayRemove(existe) });
      if (existe.emoji === emoji) return;
    }
    await updateDoc(ref, {
      reacciones: arrayUnion({
        uid: user.uid,
        nombre: user.displayName || "Usuario",
        emoji,
      }),
    });
    if (emoji === "❤️")
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
  };

  const eliminar = async (id: string) => {
    const res = await Swal.fire({
      title: "¿Eliminar?",
      icon: "warning",
      showCancelButton: true,
    });
    if (res.isConfirmed) {
      await deleteDoc(doc(db, "memorias", id));
      setSelected(null);
    }
  };

  const almanaque = () => {
    const res: any = {};
    const filtradas =
      filtro === "Todos"
        ? memorias
        : memorias.filter((m) => m.categoria === filtro);
    filtradas.forEach((m) => {
      const d = new Date(m.fecha.replace(/-/g, "/").replace("T", " "));
      const a = d.getFullYear(),
        mes = d.toLocaleString("es-ES", { month: "long" }).toUpperCase(),
        dia = d.getDate();
      if (!res[a]) res[a] = {};
      if (!res[a][mes]) res[a][mes] = {};
      if (!res[a][mes][dia])
        res[a][mes][dia] = {
          nombre: d.toLocaleString("es-ES", { weekday: "long" }),
          fotos: [],
        };
      res[a][mes][dia].fotos.push(m);
    });
    return res;
  };

  if (loading)
    return (
      <div className="text-center py-20 text-slate-400 italic">
        Cargando baúl...
      </div>
    );
  const datos = almanaque();

  return (
    <div className="w-full">
      <div className="flex gap-3 mb-10 overflow-x-auto py-2 no-scrollbar items-center">
        <Filter size={14} className="text-slate-300" />
        {categorias.map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`px-4 py-2 rounded-full text-[10px] font-black border transition-all ${
              filtro === c
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-400 border-slate-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {Object.keys(datos)
        .sort((a, b) => Number(b) - Number(a))
        .map((a) => (
          <div key={a} className="mt-10">
            <h2 className="text-6xl font-black text-slate-100 mb-6">{a}</h2>
            {Object.keys(datos[a]).map((m) => (
              <div key={m} className="mb-8 pl-6 border-l-2 border-pink-50">
                <h3 className="text-pink-400 font-bold mb-4 uppercase text-xs tracking-widest">
                  {m}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.keys(datos[a][m]).map((d) =>
                    datos[a][m][d].fotos.map((f: Memoria) => (
                      <motion.div
                        key={f.id}
                        layoutId={f.id}
                        onClick={() => {
                          setSelected(f);
                          setCurrentImgIndex(0);
                        }}
                        className="bg-white rounded-[35px] overflow-hidden shadow-md cursor-pointer hover:shadow-xl transition-shadow border border-white"
                      >
                        <img
                          src={f.urls[0]}
                          className="aspect-[4/5] object-cover w-full"
                          alt="memoria"
                        />
                        <div className="p-4 flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>
                            {d} {m}
                          </span>
                          <div className="flex gap-1">
                            {" "}
                            {f.urls.length > 1 && <Pencil size={10} />}{" "}
                            <Clock size={10} />{" "}
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
              className="relative bg-white w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]"
            >
              <div className="md:w-2/3 bg-black flex items-center relative h-full">
                <img
                  src={selected.urls[currentImgIndex]}
                  className="w-full h-full object-contain"
                  alt="preview"
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
              <div className="md:w-1/3 p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-pink-400 font-bold text-[10px] uppercase">
                      <CalendarDays size={14} /> {selected.fecha.split("T")[0]}
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-slate-300 hover:text-slate-600"
                    >
                      <X />
                    </button>
                  </div>
                  <p className="text-slate-600 italic text-lg leading-relaxed">
                    "{selected.descripcion}"
                  </p>
                </div>
                <div className="border-t pt-6">
                  <div className="flex gap-4 mb-4">
                    <button onClick={() => handleReaccionar(selected.id, "❤️")}>
                      <Heart className="text-pink-500 hover:scale-125 transition-transform" />
                    </button>
                    <button onClick={() => handleReaccionar(selected.id, "😂")}>
                      <Laugh className="text-yellow-500 hover:scale-125 transition-transform" />
                    </button>
                    <button onClick={() => handleReaccionar(selected.id, "🔥")}>
                      <Flame className="text-orange-500 hover:scale-125 transition-transform" />
                    </button>
                    <button
                      onClick={() => eliminar(selected.id)}
                      className="ml-auto text-slate-200 hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                    {selected.reacciones?.length
                      ? `Amor de: ${selected.reacciones
                          .map((r) => r.nombre)
                          .join(", ")}`
                      : "Sin reacciones aún"}
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
