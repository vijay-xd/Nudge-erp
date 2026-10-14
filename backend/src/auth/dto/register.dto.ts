import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'rahul.sharma@example.com', description: 'User work email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'SecurePassword123!', minLength: 8, description: 'User password' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'Rahul', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Sharma', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'Sharma FMCG Distributors', description: 'Organization name' })
  @IsString()
  @IsNotEmpty()
  organizationName!: string;
}
