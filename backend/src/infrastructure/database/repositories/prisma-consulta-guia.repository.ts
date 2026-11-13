import { Injectable } from '@nestjs/common';
import {
  ConsultaGuia,
  ConsultaGuiaRepository,
} from '../../../domain/guia/consulta-guia.repository.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaConsultaGuiaRepository implements ConsultaGuiaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(consulta: ConsultaGuia): Promise<void> {
    await this.prisma.consultaGuia.create({ data: consulta });
  }
}
