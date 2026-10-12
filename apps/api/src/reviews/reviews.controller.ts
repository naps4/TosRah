import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListReviewsQueryDto, UpsertReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

type AuthedReq = { user: { id: string } };

@Controller('products')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(':slug/reviews')
  list(@Param('slug') slug: string, @Query() query: ListReviewsQueryDto) {
    return this.reviews.list(slug, query.page, query.limit);
  }

  @Get(':slug/reviews/mine')
  @UseGuards(JwtAuthGuard)
  mine(@Req() req: AuthedReq, @Param('slug') slug: string) {
    return this.reviews.mine(slug, req.user.id);
  }

  @Post(':slug/reviews')
  @UseGuards(JwtAuthGuard)
  upsert(
    @Req() req: AuthedReq,
    @Param('slug') slug: string,
    @Body() dto: UpsertReviewDto,
  ) {
    return this.reviews.upsert(slug, req.user.id, dto);
  }
}