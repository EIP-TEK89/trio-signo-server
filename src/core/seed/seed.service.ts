import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from '../../modules/auth/utils/password.util';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing seed service');
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    try {
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'admin@example.com';
      const adminUsername = this.configService.get<string>('ADMIN_USERNAME') || 'admin';
      const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

      if (!adminPassword) {
        this.logger.warn('Admin password not provided in environment variables. Skipping admin user creation.');
        return;
      }

      // Check if admin user already exists
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log(`Admin user with email ${adminEmail} already exists. Skipping creation.`);
        return;
      }

      // Create admin user
      this.logger.log(`Creating admin user with username: ${adminUsername}`);
      
      const user = await this.prisma.user.create({
        data: {
          email: adminEmail,
          username: adminUsername,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN', // Set the role to ADMIN
        },
      });

      // Hash the password and create auth method
      const hashedPassword = await hashPassword(adminPassword);
      
      await this.prisma.authMethod.create({
        data: {
          userId: user.id,
          type: 'LOCAL',
          identifier: adminEmail,
          credential: hashedPassword,
          isVerified: true,
        },
      });

      this.logger.log(`Admin user created successfully with ID: ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to seed admin user: ${error.message}`, error.stack);
    }
  }
}
