import { Test, TestingModule } from '@nestjs/testing';
import { PrestacaoContasController } from './prestacao-contas.controller';
import { PrestacaoContasService } from './prestacao-contas.service';

describe('PrestacaoContasController', () => {
  let controller: PrestacaoContasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrestacaoContasController],
      providers: [PrestacaoContasService],
    }).compile();

    controller = module.get<PrestacaoContasController>(PrestacaoContasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
