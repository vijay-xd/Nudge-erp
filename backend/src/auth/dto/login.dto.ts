import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@nudge-demo.com', description: 'User login email' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'NudgeDemo2024!', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
