import { Test, TestingModule } from '@nestjs/testing';
import { PrestacaoContasService } from './prestacao-contas.service';

describe('PrestacaoContasService', () => {
  let service: PrestacaoContasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrestacaoContasService],
    }).compile();

    service = module.get<PrestacaoContasService>(PrestacaoContasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
