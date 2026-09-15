import { Module } from '@nestjs/common';
import { PrestacaoContasService } from './prestacao-contas.service';
import { PrestacaoContasController } from './prestacao-contas.controller';

@Module({
  controllers: [PrestacaoContasController],
  providers: [PrestacaoContasService],
})
export class PrestacaoContasModule {}
