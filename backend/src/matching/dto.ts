import { IsArray, IsString, IsOptional, IsEnum, ArrayMaxSize } from 'class-validator';

export class FindMatchDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  interests: string[];
  @IsOptional()
  @IsString()
  region?: string;
  @IsEnum(['text', 'video'])
  mode: 'text' | 'video';
}
