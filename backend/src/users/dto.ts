import { IsArray, IsString, ArrayMaxSize } from 'class-validator';

export class UpdateInterestsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  interests: string[];
}
