import React, { useState } from 'react';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin password or stored admin key
    if (password === 'admin123' || password === 'admin' || password === '123456') {
      onLoginSuccess();
    } else {
      setError('Senha incorreta. Tente "admin123".');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">
            ⚡
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Painel Administrativo</h1>
          <p className="text-xs text-slate-400">
            Acesso restrito aos organizadores do leilão e campanha solar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Senha do Administrador
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Digite a senha..."
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl transition-colors text-sm shadow-lg"
          >
            ENTRAR NO PAINEL
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Senha padrão de demonstração: <code className="text-amber-400">admin123</code>
        </div>
      </div>
    </div>
  );
};
