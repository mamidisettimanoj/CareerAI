import { PrismaClient, CompanyStatus } from '@prisma/client';

export interface AdminCompanyDTO {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  status: CompanyStatus;
  institutionId: string | null;
  recruiterCount: number;
  jobCount: number;
}

export interface AdminCompanyListResult {
  data: AdminCompanyDTO[];
  metadata: { page: number; pageSize: number; totalCount: number; hasNext: boolean };
}

export class AdminCompanyService {
  constructor(private readonly prisma: PrismaClient) {}

  async listCompanies(
    page = 1,
    pageSize = 20,
    search?: string,
    status?: CompanyStatus,
  ): Promise<AdminCompanyListResult> {
    const take = Math.min(pageSize, 100);
    const skip = (page - 1) * take;

    const where: any = {};
    if (status) where.status = status;
    if (search?.trim()) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const [companies, totalCount] = await Promise.all([
      this.prisma.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          website: true,
          status: true,
          institutionId: true,
          _count: { select: { memberships: true, jobs: true } },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      data: companies.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        website: c.website,
        status: c.status,
        institutionId: c.institutionId,
        recruiterCount: c._count.memberships,
        jobCount: c._count.jobs,
      })),
      metadata: { page, pageSize: take, totalCount, hasNext: skip + take < totalCount },
    };
  }

  /**
   * Admin-only company creation. Validates uniqueness server-side.
   */
  async createCompany(
    data: { name: string; description?: string; website?: string; institutionId?: string },
    auditFn: (tx: any) => Promise<void>,
  ): Promise<{ id: string }> {
    if (!data.name?.trim()) throw new Error('Company name is required.');
    if (data.name.length > 200) throw new Error('Company name exceeds maximum length.');

    const existing = await this.prisma.company.findFirst({
      where: { name: { equals: data.name.trim(), mode: 'insensitive' } },
    });
    if (existing) throw new Error(`A company named "${data.name.trim()}" already exists.`);

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.name.trim(),
          description: data.description?.trim() ?? null,
          website: data.website?.trim() ?? null,
          institutionId: data.institutionId ?? null,
          status: 'ACTIVE',
        },
      });
      await auditFn(tx);
      return { id: company.id };
    });
  }

  /**
   * Soft archive/reactivate a company.
   * Does NOT delete jobs, applications, memberships, or history.
   * Idempotent: archiving an already-archived company is a no-op.
   */
  async changeCompanyStatus(
    companyId: string,
    newStatus: CompanyStatus,
    auditFn: (tx: any) => Promise<void>,
  ): Promise<void> {
    if (!Object.values(CompanyStatus).includes(newStatus)) {
      throw new Error(`Invalid company status: ${newStatus}`);
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new Error('Company not found.');

    if (company.status === newStatus) return; // Idempotent

    await this.prisma.$transaction(async (tx) => {
      await tx.company.update({ where: { id: companyId }, data: { status: newStatus } });
      await auditFn(tx);
    });
  }

  async getCompanyById(companyId: string): Promise<AdminCompanyDTO> {
    const c = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true, name: true, description: true, website: true, status: true, institutionId: true,
        _count: { select: { memberships: true, jobs: true } },
      },
    });
    if (!c) throw new Error('Company not found.');
    return {
      id: c.id, name: c.name, description: c.description, website: c.website,
      status: c.status, institutionId: c.institutionId,
      recruiterCount: c._count.memberships, jobCount: c._count.jobs,
    };
  }
}
