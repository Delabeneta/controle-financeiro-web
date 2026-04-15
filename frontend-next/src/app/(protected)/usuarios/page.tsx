/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/usuarios/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { usersAPI, groupsAPI, userGroupsAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { 
  Plus, 
  UserCircle, 
  Mail, 
  Edit, 
  Trash2,
  Loader2,
  X,
  Link2,
} from 'lucide-react';

interface Group {
  id: string;
  nome: string;
  permission: string;
}

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  organizationId?: string;
  groups: {  
    id: string;
    nome: string;
    permission: string;
  }[];
}



// Modal de vincular usuário a grupo
function LinkUserModal({ 
  isOpen, 
  onClose, 
  onSave, 
  userId, 
  userName,
  groups 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => Promise<void>;
  userId: string;
  userName: string;
  groups: any[];
}) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    
    setLoading(true);
    try {
      await onSave({
        userId,
        groupId: selectedGroupId,
        permission: 'EDITOR', // Líder = EDITOR
      });
      onClose();
      setSelectedGroupId('');
    } catch (error) {
      console.error('Erro ao vincular usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Vincular Usuário a Grupo</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-700">
              {userName}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grupo *
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecione um grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> O usuário será vinculado como <strong>Líder</strong> do grupo selecionado, 
              podendo criar transações e gerenciar o grupo.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary-dark" disabled={loading}>
              {loading ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de criar usuário
function CreateUserModal({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (data: any) => Promise<void> }) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '123456',
    role: 'LIDER',
    organizationId: currentUser?.organizationId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onCreate(formData);
      onClose();
      setFormData({
        nome: '',
        email: '',
        senha: '123456',
        role: 'LIDER',
        organizationId: currentUser?.organizationId || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Adicionar Usuário</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Papel *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="LIDER">Líder</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>Nota:</strong> A senha padrão será <code>123456</code>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary-dark" disabled={loading}>
              {loading ? 'Adicionando...' : 'Adicionar Usuário'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; nome: string } | null>(null);

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      console.log('Usuários carregados:', response.data);
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getAll();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const handleCreateUser = async (data: any) => {
    await usersAPI.create(data);
    await loadUsers();
  };

  const handleLinkUserToGroup = async (data: any) => {
    await userGroupsAPI.create(data);
    await loadUsers(); // Recarregar para mostrar grupos vinculados
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      LIDER: 'bg-green-100 text-green-800',
    };
    
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      ADMIN: 'Admin',
      LIDER: 'Líder',
    };
    
    return (
      <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const organizationUsers = currentUser?.role === 'SUPER_ADMIN' 
    ? users 
    : users.filter(u => u.organizationId === currentUser?.organizationId);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb items={[{ label: 'Usuários' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              {organizationUsers.length} {organizationUsers.length === 1 ? 'usuário' : 'usuários'}
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {/* Users List */}
      {organizationUsers.length === 0 ? (
        <Card className="text-center py-12">
          <UserCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum usuário encontrado
          </h3>
          <p className="text-gray-600">
            Clique em Adicionar Usuário para começar.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {organizationUsers.map((user) => (
            <Card key={user.id}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                        
                        {user.nome}
                        </h3>
                      {getRoleBadge(user.role)}

                      {user.groups && user.groups.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {user.groups.map((group: Group) => (
                            <span 
                              key={group.id}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {group.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end md:justify-start flex-shrink-0">
                  {/* Botão de vincular a grupo (apenas para LÍDER) */}
                  {user.role === 'LIDER' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser({ id: user.id, nome: user.nome });
                        setShowLinkModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      <CreateUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleCreateUser}
      />

      {selectedUser && (
        <LinkUserModal
          isOpen={showLinkModal}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedUser(null);
          }}
          onSave={handleLinkUserToGroup}
          userId={selectedUser.id}
          userName={selectedUser.nome}
          groups={groups}
        />
      )}
    </div>
  );
}