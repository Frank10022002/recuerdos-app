import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import Swal from "sweetalert2";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);

      Swal.fire({
        title: "¡Bienvenido!",
        text: "Iniciaste sesión correctamente",
        icon: "success",
        confirmButtonColor: "#ec4899",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      let mensaje = "Revisa tus credenciales e intenta de nuevo.";
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        mensaje = "La contraseña o el correo son incorrectos.";
      }

      Swal.fire({
        title: "Error al entrar",
        text: mensaje,
        icon: "error",
        confirmButtonColor: "#1e293b",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafb] p-6">
      <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 w-full max-w-md">
        <h2 className="text-3xl font-serif italic text-center mb-8">
          Nustra pagina de recuerdos
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-100"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-pink-100"
          />
          <button
            type="submit"
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};
