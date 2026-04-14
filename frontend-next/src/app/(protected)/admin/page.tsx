// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { adminAPI } from '@/src/lib/api';
import { Card } from '@/components/card';
import { Button } from '@/src/components/ui/button';
import { Breadcrumb } from '@/components/BreadCrumb';
import { 
  Plus, 
  Building2, 
  Users, 
  Calendar,
  Loader2,
  X,
} from 'lucide-react';

// Componente Modal simples
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [organizations, setOrganizations] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    organizationNome: '',
    adminNome: '',
    adminEmail: '',
    adminSenha: '123456',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.role === 'SUPER_ADMIN') {
      loadOrganizations();
    }
  }, [currentUser]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrganizations();
      console.log('Organizações carregadas:', response.data);
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await adminAPI.createOrganization(formData);
      setShowCreateModal(false);
      setFormData({
        organizationNome: '',
        adminNome: '',
        adminEmail: '',
        adminSenha: '123456',
      });
      await loadOrganizations();
    } catch (err: any) {
      console.error('Erro ao criar organização:', err);
      setError(err.response?.data?.message || 'Erro ao criar organização');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Apenas Super Admin pode acessar
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-4 md:p-8">
        <Card className="text-center py-12">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
            Acesso Negado
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            Apenas Super Admins podem acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb items={[{ label: 'Administração' }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Administração</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Gerencie organizações e administradores
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Organização
          </Button>
        </div>
      </div>

      {/* Organizations List */}
      {organizations.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma organização encontrada
          </h3>
          <p className="text-gray-600">
            Clique em "Criar Organização" para começar.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{org.nome}</h3>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mt-1">
                      <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">Criada em {formatDate(org.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{org._count?.users || 0} usuários</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span>{org._count?.groups || 0} grupos</span>
                  </div>
                </div>

                {org.admin && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Administrador</p>
                    <p className="text-sm font-medium text-gray-900">{org.admin.nome}</p>
                    <p className="text-xs text-gray-600">{org.admin.email}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Nova Organização"
      >
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Organização *
            </label>
            <input
              type="text"
              value={formData.organizationNome}
              onChange={(e) => setFormData({ ...formData, organizationNome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Igreja Central"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Administrador *
            </label>
            <input
              type="text"
              value={formData.adminNome}
              onChange={(e) => setFormData({ ...formData, adminNome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail do Administrador *
            </label>
            <input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Um administrador será criado automaticamente para gerenciar esta organização.
              <br />
              <span className="text-xs">Senha padrão: 123456</span>
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Criando...' : 'Criar Organização'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}