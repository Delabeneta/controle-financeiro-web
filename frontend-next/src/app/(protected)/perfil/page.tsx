'use client';

import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { usersAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function PerfilPage() {
  const { user, updateUser } = useAuth();

  const [dadosForm, setDadosForm] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
  });
  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [showSenhas, setShowSenhas] = useState({
    atual: false, nova: false, confirmar: false,
  });
  const [loadingDados, setLoadingDados] = useState(false);
  const [loadingSenha, setLoadingSenha] = useState(false);
  const [successDados, setSuccessDados] = useState('');
  const [successSenha, setSuccessSenha] = useState('');
  const [errorDados, setErrorDados] = useState('');
  const [errorSenha, setErrorSenha] = useState('');

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDados('');
    setSuccessDados('');
    setLoadingDados(true);
    try {
      await usersAPI.update(user!.id, {
        nome: dadosForm.nome,
        email: dadosForm.email,
      });
      updateUser({ nome: dadosForm.nome, email: dadosForm.email });
      setSuccessDados('Dados atualizados com sucesso!');
    } catch (err: any) {
      setErrorDados(err.response?.data?.message || 'Erro ao atualizar dados');
    } finally {
      setLoadingDados(false);
    }
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSenha('');
    setSuccessSenha('');

    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      setErrorSenha('As senhas não coincidem');
      return;
    }
    if (senhaForm.novaSenha.length < 6) {
      setErrorSenha('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoadingSenha(true);
    try {
      await usersAPI.update(user!.id, { senha: senhaForm.novaSenha });
      setSuccessSenha('Senha alterada com sucesso!');
      setSenhaForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    } catch (err: any) {
      setErrorSenha(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setLoadingSenha(false);
    }
  };

  const roleLabel = user?.role === 'SUPER_ADMIN' ? 'Super Admin'
    : user?.role === 'ADMIN' ? 'Administrador' : 'Líder';

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Breadcrumb items={[{ label: 'Perfil' }]} />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-4">Meu perfil</h1>
        <p className="text-gray-600 mt-1 text-sm">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar + info */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user?.nome}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {roleLabel}
            </span>
          </div>
        </div>
      </Card>

      {/* Dados pessoais */}
      <Card className="mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Dados pessoais</h2>
        <form onSubmit={handleSalvarDados} className="space-y-4">
          {errorDados && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {errorDados}
            </div>
          )}
          {successDados && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              {successDados}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={dadosForm.nome}
              onChange={(e) => setDadosForm({ ...dadosForm, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              value={dadosForm.email}
              onChange={(e) => setDadosForm({ ...dadosForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="default"
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={loadingDados}
            >
              {loadingDados ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar dados
            </Button>
          </div>
        </form>
      </Card>

      {/* Alterar senha */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Alterar senha</h2>
        <form onSubmit={handleAlterarSenha} className="space-y-4">
          {errorSenha && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {errorSenha}
            </div>
          )}
          {successSenha && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              {successSenha}
            </div>
          )}

          {[
            { key: 'senhaAtual', label: 'Senha atual', show: showSenhas.atual, toggle: () => setShowSenhas(s => ({ ...s, atual: !s.atual })) },
            { key: 'novaSenha', label: 'Nova senha', show: showSenhas.nova, toggle: () => setShowSenhas(s => ({ ...s, nova: !s.nova })) },
            { key: 'confirmarSenha', label: 'Confirmar nova senha', show: showSenhas.confirmar, toggle: () => setShowSenhas(s => ({ ...s, confirmar: !s.confirmar })) },
          ].map(({ key, label, show, toggle }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={senhaForm[key as keyof typeof senhaForm]}
                  onChange={(e) => setSenhaForm({ ...senhaForm, [key]: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="default"
              className="bg-primary hover:bg-primary-dark text-white"
              disabled={loadingSenha}
            >
              {loadingSenha ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Alterar senha
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}