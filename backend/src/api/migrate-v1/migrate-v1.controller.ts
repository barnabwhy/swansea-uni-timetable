import { Controller, Get, Req, Res } from '@nestjs/common';

@Controller()
export class ApiMigrationController {
  constructor() {}

  @Get('api')
  getApi(@Req() req, @Res() res) {
    res.redirect(req.originalUrl.replace(/^\/api/, '/api/v1'));
  }

  @Get('types')
  getTypes(@Req() req, @Res() res) {
    res.redirect(req.originalUrl.replace(/^\/types/, '/api/v1/types'));
  }

  @Get('typesEx')
  getTypesEx(@Req() req, @Res() res) {
    res.redirect(req.originalUrl.replace(/^\/typesEx/, '/api/v1/typesEx'));
  }

  @Get('cats')
  getCats(@Req() req, @Res() res) {
    res.redirect(req.originalUrl.replace(/^\/cats/, '/api/v1/cats'));
  }

  // :type/:cat/week/:week
  @Get(':type((\\w+-)+\\w+)/:cat/week/:week(\\d+)')
  getWeek(@Req() req, @Res() res) {
    res.redirect('/api/v1' + req.originalUrl);
  }

  // :type/:cat/:weekOffset
  @Get(':type((\\w+-)+\\w+)/:cat/:weekOffset(\\d+)')
  getWeekOffset(@Req() req, @Res() res) {
    res.redirect('/api/v1' + req.originalUrl);
  }

  // :type/:cat
  @Get(':type((\\w+-)+\\w+)/:cat')
  getCat(@Req() req, @Res() res) {
    res.redirect('/api/v1' + req.originalUrl);
  }
}
