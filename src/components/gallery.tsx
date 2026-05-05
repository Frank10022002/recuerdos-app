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
  fecha: string;
  autor: string;
  categoria: string;
  reacciones?: Reaccion[];
}

export const Gallery: React.FC = () => {
  const [memorias, setMemorias] = useState<Memoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Memoria | null>(null);
  const [idx, setIdx] = useState(0);
  const [filtro, setFiltro] = useState("Todos");

  useEffect(() => {
    const q = query(collection(db, "memorias"), orderBy("fecha", "desc"));
    return onSnapshot(q, (snap) => {
      setMemorias(
        snap.docs.map((d) => ({
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
    const m = memorias.find((mem) => mem.id === mId);
    if (!m) return;
    const ref = doc(db, "memorias", mId);
    const existe = m.reacciones?.find((r) => r.uid === auth.currentUser?.uid);
    if (existe) await updateDoc(ref, { reacciones: arrayRemove(existe) });
    await updateDoc(ref, {
      reacciones: arrayUnion({
        uid: auth.currentUser.uid,
        nombre: auth.currentUser.displayName,
        emoji,
      }),
    });
    if (emoji === "❤️")
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
  };

  const obtenerAlmanaque = () => {
    const res: any = {};
    const filtradas =
      filtro === "Todos"
        ? memorias
        : memorias.filter((m) => m.categoria === filtro);
    filtradas.forEach((m) => {
      const d = new Date(m.fecha);
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
        Abriendo el baúl...
      </div>
    );
  const almanaque = obtenerAlmanaque();

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-10 overflow-x-auto py-2 no-scrollbar">
        {["Todos", "Cita", "Viaje", "Comida", "Momentos"].map((c) => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase border transition-all ${
              filtro === c
                ? "bg-slate-900 text-white shadow-xl"
                : "bg-white text-slate-400 border-slate-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {Object.keys(almanaque)
        .sort((a, b) => Number(b) - Number(a))
        .map((anio) => (
          <div key={anio}>
            <h2 className="text-7xl font-black text-slate-50/50 mb-10 tracking-tighter">
              {anio}
            </h2>
            {Object.keys(almanaque[anio]).map((mes) => (
              <div key={mes} className="mb-12 pl-8 border-l-2 border-pink-50">
                <h3 className="text-pink-400 font-bold mb-6 italic uppercase tracking-widest">
                  {mes}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {Object.keys(almanaque[anio][mes]).map((dia) =>
                    almanaque[anio][mes][dia].fotos.map((f: Memoria) => (
                      <motion.div
                        key={f.id}
                        layoutId={f.id}
                        onClick={() => {
                          setSelected(f);
                          setIdx(0);
                        }}
                        className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-slate-100 cursor-pointer hover:scale-[1.02] transition-transform"
                      >
                        <div className="relative">
                          <img
                            src={f.urls[0]}
                            className="aspect-[4/5] object-cover w-full"
                            alt="recuerdo"
                          />
                          {f.urls.length > 1 && (
                            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-slate-800">
                              +{f.urls.length - 1}
                            </div>
                          )}
                        </div>
                        <div className="p-6 text-[10px] font-black text-slate-400 uppercase flex justify-between">
                          <span>
                            {dia} {mes}
                          </span>
                          <div className="flex gap-1">
                            <Clock size={12} /> <Heart size={12} />{" "}
                            {f.reacciones?.length || 0}
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
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
            />
            <motion.div
              layoutId={selected.id}
              className="relative bg-white w-full max-w-5xl rounded-[50px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[80vh] md:h-auto"
            >
              <div className="md:w-[65%] bg-black relative flex items-center h-[50%] md:h-auto">
                <img
                  src={selected.urls[idx]}
                  className="w-full h-full object-contain"
                  alt="preview"
                />
                {selected.urls.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIdx((prev) =>
                          prev > 0 ? prev - 1 : selected.urls.length - 1
                        );
                      }}
                      className="absolute left-4 p-2 bg-white/20 rounded-full text-white"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIdx((prev) =>
                          prev < selected.urls.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="absolute right-4 p-2 bg-white/20 rounded-full text-white"
                    >
                      <ChevronRight />
                    </button>
                  </>
                )}
              </div>
              <div className="md:w-[35%] p-10 flex flex-col justify-between bg-white">
                <div>
                  <div className="flex justify-between mb-6">
                    <span className="text-[10px] font-black text-pink-400 uppercase tracking-[0.2em]">
                      {selected.categoria}
                    </span>
                    <button
                      onClick={() => setSelected(null)}
                      className="text-slate-300 hover:text-slate-500"
                    >
                      <X />
                    </button>
                  </div>
                  <p className="text-xl font-serif italic text-slate-700 leading-relaxed">
                    "{selected.descripcion}"
                  </p>
                </div>
                <div className="border-t pt-8">
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => handleReaccionar(selected.id, "❤️")}
                      className="hover:scale-125 transition-transform"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={() => handleReaccionar(selected.id, "😂")}
                      className="hover:scale-125 transition-transform"
                    >
                      😂
                    </button>
                    <button
                      onClick={() => handleReaccionar(selected.id, "🔥")}
                      className="hover:scale-125 transition-transform"
                    >
                      🔥
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          (
                            await Swal.fire({
                              title: "¿Borrar?",
                              showCancelButton: true,
                            })
                          ).isConfirmed
                        ) {
                          await deleteDoc(doc(db, "memorias", selected.id));
                          setSelected(null);
                        }
                      }}
                      className="ml-auto text-slate-200 hover:text-red-400"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                    {selected.reacciones?.length
                      ? `Reacciones de: ${selected.reacciones
                          .map((r) => r.nombre)
                          .join(", ")}`
                      : "Sé el primero en reaccionar"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
