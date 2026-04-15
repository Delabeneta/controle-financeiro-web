/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, User } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(user: User) {
    // 1. Buscar grupos do usuário (com transações e contagem de membros)
    const groups = await this.prisma.group.findMany({
      where: this.getGroupWhereByRole(user),
      include: {
        transactions: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    let totalBalance = 0;
    let totalMembers = 0;

    const topGroups: any[] = [];

    // 2. Processamento LOCAL (rápido, sem novas queries)
    for (const group of groups) {
      const saldo = this.calculateGroupBalance(group);

      totalBalance += saldo;
      totalMembers += group._count.users;

      topGroups.push({
        id: group.id,
        name: group.nome,
        balance: saldo,
        memberCount: group._count.users,
      });
    }

    // Ordenar top grupos
    topGroups.sort((a, b) => b.balance - a.balance);

    // 3. Chart fake estruturado (você pode evoluir depois)
    const chartData = this.buildChartFromGroups(groups);

    return {
      totalBalance,
      activeGroups: groups.length,
      totalMembers,
      chartData,
      topGroups: topGroups.slice(0, 5),
    };
  }

  // 🔐 Regras de acesso por role
  private getGroupWhereByRole(user: User) {
    if (user.role === Role.SUPER_ADMIN) {
      return {};
    }

    if (user.role === Role.ADMIN) {
      return {
        organizationId: user.organizationId!,
      };
    }

    // LÍDER
    return {
      users: {
        some: {
          userId: user.id,
        },
      },
    };
  }

  // 💰 Calcula saldo do grupo (SEM query extra)
  private calculateGroupBalance(group: any) {
    let totalEntradas = 0;
    let totalSaidas = 0;

    for (const t of group.transactions) {
      const valor = Number(t.valor);

      if (t.type === 'ENTRADA') {
        totalEntradas += valor;
      } else {
        totalSaidas += valor;
      }
    }

    const saldoInicial = group.saldoInicial ? Number(group.saldoInicial) : 0;

    return saldoInicial + totalEntradas - totalSaidas;
  }

  // 📊 Gera dados do gráfico (últimos 6 meses simples)
  private buildChartFromGroups(groups: any[]) {
    const today = new Date();

    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);

      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('pt-BR', { month: 'short' }),
      };
    });

    return months.map((m) => {
      let entradas = 0;
      let saidas = 0;

      for (const group of groups) {
        for (const t of group.transactions) {
          const d = new Date(t.data);

          if (d.getFullYear() === m.year && d.getMonth() === m.month) {
            const valor = Number(t.valor);

            if (t.type === 'ENTRADA') {
              entradas += valor;
            } else {
              saidas += valor;
            }
          }
        }
      }

      return {
        month: m.label,
        entradas,
        saidas,
      };
    });
  }
}
