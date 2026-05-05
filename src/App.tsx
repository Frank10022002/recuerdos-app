import { useState, useEffect, useRef } from "react";
import { auth } from "./firebaseConfig";
import {
  onAuthStateChanged,
  type User,
  updateProfile,
  signOut,
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CloudUpload,
  User as UserIcon,
  LogOut,
  Heart,
  Menu,
  X,
  Camera,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";

import { Gallery } from "./components/gallery";
import { UploadMemory } from "./components/uploadMemory";
import { LoveCounter } from "./components/loveCounter";
import { Login } from "./components/login";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gallery");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [subiendoPerfil, setSubiendoPerfil] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || "");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro(a) de que quieres salir?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1e293b",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      customClass: { popup: "rounded-[32px]" },
    }).then((result) => {
      if (result.isConfirmed) signOut(auth);
    });
  };

  // FUNCIÓN CORREGIDA PARA ACTUALIZACIÓN INMEDIATA
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSubiendoPerfil(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "baul_recuerdos");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/duq6yy1su/auto/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (data.secure_url) {
        // 1. Actualizamos en Firebase
        await updateProfile(user, { photoURL: data.secure_url });
        await user.reload();
        const updatedUser = auth.currentUser;
        setUser(updatedUser);

        Swal.fire({
          title: "¡Foto actualizada!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: "rounded-[32px]" },
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Ocurrió un problema al subir la foto", "error");
    } finally {
      setSubiendoPerfil(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSubiendoPerfil(true);
    try {
      await updateProfile(user, { displayName });
      Swal.fire({
        title: "¡Listo!",
        text: "Apodo actualizado",
        icon: "success",
        timer: 1250,
        showConfirmButton: false,
        customClass: { popup: "rounded-[32px]" },
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo actualizar", "error");
    } finally {
      setSubiendoPerfil(false);
    }
  };

  const dispararRecuerdoAzar = () => {
    setActiveTab("gallery");
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new Event("magicMemory"));
    }, 200);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafb]">
        <Heart className="animate-pulse text-pink-500" size={48} />
      </div>
    );

  if (!user) return <Login />;

  const menuItems = [
    {
      id: "gallery",
      label: "Nuestro Baúl",
      icon: <LayoutDashboard size={20} />,
    },
    { id: "upload", label: "Subir Recuerdo", icon: <CloudUpload size={20} /> },
    { id: "profile", label: "Mi Perfil", icon: <UserIcon size={20} /> },
  ];

  return (
    <div className="flex h-screen w-full bg-[#fafafb] text-slate-900 font-sans overflow-hidden">
      {/* SIDEBAR PC */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100 p-8 h-full z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Heart size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-serif italic font-bold">Nuestro Baúl</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id
                  ? "bg-slate-900 text-white shadow-xl"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {item.icon} <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={dispararRecuerdoAzar}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-pink-500 bg-pink-50 mt-6 group border border-pink-100"
          >
            <Sparkles
              size={20}
              className="group-hover:rotate-12 transition-transform"
            />
            <span>Recuerdo Aleatorio</span>
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-4 px-4 py-4 text-red-400 font-bold hover:bg-red-50 rounded-2xl transition-all"
        >
          <LogOut size={20} /> <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* BOTÓN MÓVIL */}
      <button
        className="md:hidden fixed top-6 right-6 z-[60] bg-white p-3 rounded-2xl shadow-xl border border-slate-100"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 h-full overflow-y-auto scroll-smooth">
        <div className="max-w-6xl mx-auto p-6 md:p-12 lg:p-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === "gallery" && (
                <div className="space-y-12">
                  <header>
                    <h2 className="text-3xl md:text-5xl font-serif italic text-slate-800">
                      Nuestra Historia
                    </h2>
                  </header>
                  <LoveCounter />
                  <Gallery />
                </div>
              )}

              {activeTab === "upload" && (
                <UploadMemory onComplete={() => setActiveTab("gallery")} />
              )}

              {activeTab === "profile" && (
                <div className="max-w-xl mx-auto pt-10">
                  <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-100 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <div className="relative w-full h-full">
                        <img
                          src={
                            user.photoURL ||
                            `https://ui-avatars.com/api/?name=${
                              user.displayName || user.email
                            }&background=fce7f3&color=ec4899`
                          }
                          className={`w-full h-full rounded-[40px] object-cover border-4 border-white shadow-xl ${
                            subiendoPerfil ? "opacity-30" : "opacity-100"
                          }`}
                        />
                        {subiendoPerfil && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="animate-spin text-pink-500" />
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoPerfil}
                        className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                      >
                        <Camera size={20} />
                      </button>
                    </div>

                    <div className="space-y-6 text-left">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                          Tu Apodo
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-100 font-medium"
                        />
                      </div>
                      <button
                        onClick={handleUpdateProfile}
                        disabled={subiendoPerfil}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                      >
                        {subiendoPerfil ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check size={20} />
                        )}
                        {subiendoPerfil ? "Guardando..." : "Actualizar Perfil"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* MENÚ MÓVIL */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 p-10 flex flex-col md:hidden"
            >
              <div className="flex items-center gap-3 mb-16">
                <Heart
                  className="text-pink-500"
                  fill="currentColor"
                  size={24}
                />
                <h1 className="text-2xl font-serif italic font-bold">
                  Nuestro Baúl
                </h1>
              </div>
              <nav className="flex-1 space-y-6">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-6 text-2xl font-serif italic ${
                      activeTab === item.id ? "text-pink-500" : "text-slate-400"
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
                <button
                  onClick={dispararRecuerdoAzar}
                  className="w-full flex items-center gap-6 text-2xl font-serif italic text-pink-500 pt-4"
                >
                  <Sparkles size={24} /> Recuerdo Aleatorio
                </button>
              </nav>
              <div className="mt-auto pt-6 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-4 py-4 text-red-400 font-bold w-full"
                >
                  <LogOut size={20} />{" "}
                  <span className="text-lg">Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
