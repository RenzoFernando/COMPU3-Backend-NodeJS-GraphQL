import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vault, VaultSchema } from './entities/vault.entity';
import { VaultsResolver } from './vaults.resolver';
import { VaultsService } from './vaults.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Vault.name, schema: VaultSchema }])],
  providers: [VaultsResolver, VaultsService],
  exports: [VaultsService],
})
export class VaultsModule {}
