/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/grupos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { usersAPI, groupsAPI, adminAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { Plus, Users, Edit, Loader2, X } from 'lucide-react';
import { EditGroupModal } from '@/components/EditGroupModal';

function CreateGroupModal({ 
  isOpen, 
  onClose, 
  onSave, 
  organizations = [], 
  userRole 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: any) => Promise<void>;
  organizations?: any[];
  userRole?: string;
}) {
  const [formData, setFormData] = useState({
    nome: '',
    organizationId: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        nome: formData.nome,
        organizationId: formData.organizationId,
      };
      
      console.log('Enviando dados:', dataToSend);
      await onSave(dataToSend);
      onClose();
      setFormData({ nome: '', organizationId: '' });
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Criar Novo Grupo</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Grupo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Jovens da Igreja"
              required
            />
          </div>
          
          {/* Para SUPER_ADMIN, mostrar select de organizações */}
          {userRole === 'SUPER_ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organização *
              </label>
              <select
                value={formData.organizationId}
                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Selecione uma organização</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.nome}</option>
                ))}
              </select>
            </div>
          )}
          
    
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary-dark" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GroupWithBalance {
  id: string;
  nome: string;
  saldoTotal: number;
  saldoBanco: number;
  saldoCaixa: number;
  createdAt: string;
  membersCount: number;
  permission?: string;
}

export default function GruposPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithBalance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    loadGroups();
    if (user?.role === 'SUPER_ADMIN') {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      const response = await adminAPI.getOrganizations();
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    }
  };

  const loadGroups = async () => {
  try {
    setLoading(true);
    let groupsData = [];

    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      const response = await groupsAPI.getAll();
      const rawGroups = response.data || [];

      // Buscar saldos de cada grupo em paralelo
      groupsData = await Promise.all(
        rawGroups.map(async (group: any) => {
          try {
            const saldosRes = await groupsAPI.getSaldos(group.id);
            const saldos = saldosRes.data || {};
            return { ...group, ...saldos };
          } catch {
            return group;
          }
        })
      );
    } else {
      const response = await usersAPI.getMyGroups();
      groupsData = response.data.groups || [];
    }

    const formattedGroups = groupsData.map((group: any) => ({
      id: group.id,
      nome: group.nome,
      saldoTotal: group.saldoTotal || 0,
      saldoBanco: group.saldoBanco || 0,
      saldoCaixa: group.saldoCaixa || 0,
      createdAt: group.createdAt || group.joinedAt,
      membersCount: group.membersCount || 0,
      permission: group.permission,
      //liderNome: group.liderNome || group.LeaderName || 'Não definido',
    }));

    setGroups(formattedGroups);
  } catch (error) {
    console.error('Erro ao carregar grupos:', error);
  } finally {
    setLoading(false);
  }
};
const handleCreateGroup = async (data: any) => {
  const payload = {
    ...data,
    organizationId: data.organizationId || user?.organizationId,
  };
  await groupsAPI.create(payload); 
  await loadGroups();
};

  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleOpenModal = (group: GroupWithBalance) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Breadcrumb items={[{ label: 'Grupos' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Grupos</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
            </p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <Button variant="default" className="w-full sm:w-auto" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Grupo
            </Button>
          )}
        </div>  
      </div>

      {groups.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            Nenhum grupo encontrado
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') 
              ? 'Clique em "Criar Grupo" para começar.'
              : 'Entre em contato com um administrador para ser adicionado a um grupo.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/grupos/${group.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base md:text-lg font-semibold text-gray-900">
                  {group.nome}
                </h3>
                {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(group);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-400 hover:text-primary" />
                  </button>
                )}
              </div>

   {/*       <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <User className="w-4 h-4" />
                <span>Líder: {user?.nome || 'Não definido'}</span>
              </div>       */}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Em dinheiro</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(group.saldoCaixa)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Em banco/PIX</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {formatCurrency(group.saldoBanco)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Saldo total</span>
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(group.saldoTotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {group.membersCount} membros
                </div>
                <span>{new Date(group.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

       <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateGroup}
        organizations={organizations}
        userRole={user?.role}
      />
    </div>
  );
}