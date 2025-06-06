import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * @description Sets up Swagger API documentation for the application, with Bearer authentication for the DEV environment.
 * @param {INestApplication} app - The NestJS application instance.
 * @returns {void} This function does not return anything, it configures the Swagger documentation for the app.
 * @throws {Error} If there is an issue with setting up Swagger or generating the documentation, an error will be thrown.
 */
export function setupSwagger(app: INestApplication): void {
  if (process.env.ENV === 'DEV') {
    const config = new DocumentBuilder()
      .setTitle('Fair-Point API')
      .setDescription('Fair-Point API documentation')
      .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        description: `    Admin Token:
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiNjczZDdjYmNlYzdkMmNlMzJlMzdiZjA2IiwiaWF0IjoxNzMyOTQ5NDUxLCJleHAiOjI1OTY5NDk0NTF9.oTwZW_oho48u4Cea7aySdjsGFFkj7ZXW8W_ilD85HUQ
        
    User Token:
        eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2R1bGUiOiJVU0VSIiwib3JnSWQiOiI2NzNkN2NiY2VjN2QyY2UzMmUzN2JmMDIiLCJ1c2VySWQiOiI2NzNkOGZkOWY2ZDY2Mzc0ZmI4NGZmMmYiLCJzZXNzaW9uSWQiOiJjOGY3MWZjZS05MjUxLTQ5Y2ItODA1Ny03MWMxNzNiZTU4MWQiLCJpYXQiOjE3MzI5NDk2NDEsImV4cCI6MjU5Njk0OTY0MX0.n-nnlz__pWOaGJuWD9fNEF4PFj-gsfqDq9gTRIw-LHk
        `,
      })
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }
}
